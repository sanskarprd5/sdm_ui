import { HttpErrorResponse, HttpHeaders, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';

import { authInterceptor } from './auth.interceptor';
import { AuthService, LoginResponse } from './auth.service';

describe('authInterceptor', () => {
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'getAccessToken',
      'getTokenType',
      'refreshToken',
      'logout',
      'isRefreshing',
      'getTokenObservable'
    ]);

    authService.getTokenType.and.returnValue('Bearer');
    authService.isRefreshing.and.returnValue(false);
    authService.getTokenObservable.and.returnValue(of(null));

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: authService }]
    });
  });

  const invoke = (req: HttpRequest<unknown>, next: (req: HttpRequest<unknown>) => any) =>
    TestBed.runInInjectionContext(() => authInterceptor(req, next));

  it('should skip auth endpoints without touching tokens', () => {
    const req = new HttpRequest('POST', '/auth/login', {});
    const next = jasmine.createSpy().and.returnValue(of(new HttpResponse({ status: 200 })));

    invoke(req, next).subscribe();

    expect(next).toHaveBeenCalledWith(req);
    expect(authService.getAccessToken).not.toHaveBeenCalled();
  });

  it('should forward requests untouched when bypass token is active', () => {
    authService.getAccessToken.and.returnValue('bypass-mock-access-token');

    const req = new HttpRequest('GET', '/api/data');
    const next = jasmine.createSpy().and.returnValue(of(new HttpResponse({ status: 200 })));

    invoke(req, next).subscribe();

    expect(next.calls.mostRecent().args[0]).toBe(req);
  });

  it('should attach authorization header when access token exists', () => {
    authService.getAccessToken.and.returnValue('real-token');

    const req = new HttpRequest('GET', '/api/data');
    const next = jasmine
      .createSpy()
      .and.callFake((forwardReq: HttpRequest<unknown>) => {
        expect(forwardReq.headers.get('Authorization')).toBe('Bearer real-token');
        return of(new HttpResponse({ status: 200 }));
      });

    invoke(req, next).subscribe();
  });

  it('should refresh token and retry once after 401 responses', () => {
    authService.getAccessToken.and.returnValue('expired-token');
    const refreshed: LoginResponse = {
      accessToken: 'new-token',
      refreshToken: 'refresh',
      tokenType: 'Bearer',
      accessTokenExpiresInSeconds: 3600
    };
    authService.refreshToken.and.returnValue(of(refreshed));

    const next = jasmine
      .createSpy('next')
      .and.callFake((forwardReq: HttpRequest<unknown>) => {
        if (forwardReq.headers.has('X-Auth-Retry-Attempt')) {
          expect(forwardReq.headers.get('Authorization')).toBe('Bearer new-token');
          return of(new HttpResponse({ status: 200 }));
        }
        return throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }));
      });

    invoke(new HttpRequest('GET', '/secure'), next).subscribe();

    expect(authService.refreshToken).toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(2);
  });

  it('should queue while token is refreshing and reuse emitted token', () => {
    authService.getAccessToken.and.returnValue('expired-token');
    authService.isRefreshing.and.returnValue(true);
    const tokenSubject = new Subject<string | null>();
    authService.getTokenObservable.and.returnValue(tokenSubject.asObservable());

    const next = jasmine
      .createSpy('next')
      .and.callFake((forwardReq: HttpRequest<unknown>) => {
        if (forwardReq.headers.has('X-Auth-Retry-Attempt')) {
          expect(forwardReq.headers.get('Authorization')).toBe('Bearer shared-token');
          return of(new HttpResponse({ status: 200 }));
        }
        return throwError(() => new HttpErrorResponse({ status: 401 }));
      });

    const request$ = invoke(new HttpRequest('GET', '/secure'), next);

    // Emit token after subscription to simulate completion of refresh happening elsewhere
    request$.subscribe();
    tokenSubject.next('shared-token');
    tokenSubject.complete();

    expect(next).toHaveBeenCalledTimes(2);
  });

  it('should logout when refresh endpoint itself fails with auth error', () => {
    const req = new HttpRequest('POST', '/auth/refresh', {}, { headers: new HttpHeaders() });

    const next = jasmine.createSpy().and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }))
    );

    invoke(req, next).subscribe({
      next: () => fail('Expected refresh failure to error'),
      error: () => {}
    });

    expect(authService.logout).toHaveBeenCalled();
  });

  it('should logout when refresh attempt fails downstream', () => {
    authService.getAccessToken.and.returnValue('token');
    authService.refreshToken.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 400, statusText: 'Bad Request' }))
    );

    const next = jasmine.createSpy().and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }))
    );

    invoke(new HttpRequest('GET', '/secure'), next).subscribe({
      next: () => fail('Expected final observable to error'),
      error: () => {}
    });

    expect(authService.logout).toHaveBeenCalled();
  });
});
