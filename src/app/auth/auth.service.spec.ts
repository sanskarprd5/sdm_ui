import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { AuthService, LoginResponse } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;
  let storage: Record<string, string>;

  const API_BASE = 'http://192.168.0.43:8080/smart-sdm-api/api/v1/auth';

  const buildToken = () => {
    const payload = btoa(JSON.stringify({ sub: 'tester', iss: 'suite', iat: 1, exp: 2 }));
    return `header.${payload}.signature`;
  };

  beforeEach(() => {
    storage = {};
    spyOn(window.localStorage, 'getItem').and.callFake((key: string) => storage[key] ?? null);
    spyOn(window.localStorage, 'setItem').and.callFake((key: string, value: string) => {
      storage[key] = value;
    });
    spyOn(window.localStorage, 'removeItem').and.callFake((key: string) => {
      delete storage[key];
    });

    router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: Router, useValue: router }]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  const buildLoginResponse = (overrides: Partial<LoginResponse> = {}): LoginResponse => ({
    accessToken: buildToken(),
    refreshToken: 'refresh-token',
    tokenType: 'Bearer',
    accessTokenExpiresInSeconds: 3600,
    ...overrides
  });

  it('should login, persist tokens, and schedule refresh', () => {
    const scheduleSpy = spyOn<any>(service, 'scheduleTokenRefresh').and.callThrough();
    const mockResponse = buildLoginResponse();

    service.login('demo', 'secret').subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${API_BASE}/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'demo', password: 'secret' });
    req.flush(mockResponse);

    expect(window.localStorage.setItem).toHaveBeenCalledWith('accessToken', mockResponse.accessToken);
    expect(window.localStorage.setItem).toHaveBeenCalledWith('refreshToken', mockResponse.refreshToken);
    expect(window.localStorage.setItem).toHaveBeenCalledWith('userData', jasmine.any(String));
    expect(scheduleSpy).toHaveBeenCalled();
  });

  it('should surface login errors without persisting tokens', () => {
    const scheduleSpy = spyOn<any>(service, 'scheduleTokenRefresh');
    let capturedError: any;

    service.login('demo', 'bad').subscribe({
      next: () => fail('Expected login to fail'),
      error: err => (capturedError = err)
    });

    const req = httpMock.expectOne(`${API_BASE}/login`);
    req.flush('Invalid credentials', { status: 401, statusText: 'Unauthorized' });

    expect(capturedError.status).toBe(401);
    expect(scheduleSpy).not.toHaveBeenCalled();
    expect(storage['accessToken']).toBeUndefined();
  });

  it('should refresh token, update storage, and emit new value', () => {
    storage['refreshToken'] = 'existing-refresh-token';
    const emissions: Array<string | null> = [];
    service.getTokenObservable().subscribe(token => emissions.push(token));

    const response = buildLoginResponse({ accessToken: 'new-access', refreshToken: 'new-refresh' });

    service.refreshToken().subscribe(result => {
      expect(result).toEqual(response);
    });

    expect(service.isRefreshing()).toBeTrue();

    const req = httpMock.expectOne(`${API_BASE}/refresh`);
    expect(req.request.body).toEqual({ refreshToken: 'existing-refresh-token' });
    req.flush(response);

    expect(service.isRefreshing()).toBeFalse();
    expect(window.localStorage.setItem).toHaveBeenCalledWith('accessToken', 'new-access');
    expect(window.localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'new-refresh');
    expect(emissions[emissions.length - 1]).toBe('new-access');
  });

  it('should error when refresh token is missing', (done) => {
    service.refreshToken().subscribe({
      next: () => fail('Expected refresh to fail'),
      error: err => {
        expect(err.message).toContain('No refresh token available');
        done();
      }
    });

    httpMock.expectNone(`${API_BASE}/refresh`);
  });

  it('should logout when refresh call fails', () => {
    storage['refreshToken'] = 'existing-refresh-token';
    const logoutSpy = spyOn(service, 'logout').and.returnValue(of(null));

    service.refreshToken().subscribe({
      next: () => fail('Expected refresh to propagate error'),
      error: () => {}
    });

    const req = httpMock.expectOne(`${API_BASE}/refresh`);
    req.flush('Invalid', { status: 401, statusText: 'Unauthorized' });

    expect(logoutSpy).toHaveBeenCalled();
  });

  it('should call logout endpoint and clear tokens', () => {
    storage['refreshToken'] = 'existing-refresh-token';
    storage['accessToken'] = 'existing-access-token';

    service.logout();

    const req = httpMock.expectOne(`${API_BASE}/logout`);
    expect(req.request.body).toEqual({ refreshToken: 'existing-refresh-token' });
    req.flush({});

    expect(window.localStorage.removeItem).toHaveBeenCalledWith('accessToken');
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should report login status based on expiry and tokens', () => {
    storage['accessToken'] = 'token';
    storage['refreshToken'] = 'refresh';
    storage['tokenExpiry'] = (Date.now() + 60_000).toString();

    expect(service.isLoggedIn()).toBeTrue();

    storage['tokenExpiry'] = (Date.now() - 1_000).toString();
    expect(service.isLoggedIn()).toBeFalse();
  });
});
