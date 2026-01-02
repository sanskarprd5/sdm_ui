import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from '../auth/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'isLoggedIn']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    // Default: user not logged in
    authServiceSpy.isLoggedIn.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('constructor', () => {
    it('should redirect to arrival if user is already logged in', () => {
      authService.isLoggedIn.and.returnValue(true);
      
      const component2 = new LoginComponent(router, authService);

      expect(router.navigate).toHaveBeenCalledWith(['/arrival']);
    });

    it('should not redirect if user is not logged in', () => {
      authService.isLoggedIn.and.returnValue(false);
      router.navigate.calls.reset();

      const component2 = new LoginComponent(router, authService);

      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('togglePassword', () => {
    it('should toggle showPassword flag', () => {
      component.showPassword = false;

      component.togglePassword();
      expect(component.showPassword).toBe(true);

      component.togglePassword();
      expect(component.showPassword).toBe(false);
    });
  });

  describe('login', () => {
    it('should show error when username is empty', () => {
      component.username = '';
      component.password = 'password';

      component.login();

      expect(component.errorMessage).toBe('Please enter username and password');
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should show error when password is empty', () => {
      component.username = 'testuser';
      component.password = '';

      component.login();

      expect(component.errorMessage).toBe('Please enter username and password');
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should handle bypass login for sanskar/pwd1', fakeAsync(() => {
      component.username = 'sanskar';
      component.password = 'pwd1';
      spyOn(localStorage, 'setItem');
      spyOn(console, 'log');

      component.login();

      expect(component.isLoading).toBe(true);
      expect(component.successMessage).toBe('Login successful! Redirecting...');
      expect(localStorage.setItem).toHaveBeenCalledWith('accessToken', 'bypass-mock-access-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'bypass-mock-refresh-token');
      expect(console.log).toHaveBeenCalledWith('Bypass login successful - skipping API');

      tick(1000);

      expect(component.isLoading).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/arrival']);
    }));

    it('should handle bypass login case-insensitively', fakeAsync(() => {
      component.username = 'SANSKAR';
      component.password = 'pwd1';

      component.login();

      expect(component.successMessage).toBe('Login successful! Redirecting...');

      tick(1000);
      expect(router.navigate).toHaveBeenCalledWith(['/arrival']);
    }));

    it('should call API for non-bypass credentials', () => {
      component.username = 'testuser';
      component.password = 'testpass';
      const mockResponse = {
        accessToken: 'token123',
        refreshToken: 'refresh123',
        tokenType: 'Bearer',
        accessTokenExpiresInSeconds: 3600
      };
      authService.login.and.returnValue(of(mockResponse));

      component.login();

      expect(component.isLoading).toBe(true);
      expect(authService.login).toHaveBeenCalledWith('testuser', 'testpass');
    });

    it('should handle successful API login', fakeAsync(() => {
      component.username = 'testuser';
      component.password = 'testpass';
      const mockResponse = {
        accessToken: 'token123',
        refreshToken: 'refresh123',
        tokenType: 'Bearer',
        accessTokenExpiresInSeconds: 3600
      };
      authService.login.and.returnValue(of(mockResponse));
      spyOn(console, 'log');

      component.login();

      expect(component.successMessage).toBe('Login successful! Redirecting...');
      expect(console.log).toHaveBeenCalledWith('Login successful:', mockResponse);

      tick(1000);

      expect(component.isLoading).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/arrival']);
    }));

    it('should handle 401 unauthorized error', () => {
      component.username = 'wronguser';
      component.password = 'wrongpass';
      const error = { status: 401 };
      authService.login.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      component.login();

      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('Invalid username or password');
      expect(console.error).toHaveBeenCalledWith('Login error:', error);
    });

    it('should handle network error (status 0)', () => {
      component.username = 'testuser';
      component.password = 'testpass';
      const error = { status: 0 };
      authService.login.and.returnValue(throwError(() => error));

      component.login();

      expect(component.errorMessage).toBe('Cannot connect to server. Please check if the backend is running.');
    });

    it('should handle generic error with message', () => {
      component.username = 'testuser';
      component.password = 'testpass';
      const error = { status: 500, error: { message: 'Server error occurred' } };
      authService.login.and.returnValue(throwError(() => error));

      component.login();

      expect(component.errorMessage).toBe('Server error occurred');
    });

    it('should handle generic error without message', () => {
      component.username = 'testuser';
      component.password = 'testpass';
      const error = { status: 500, error: {} };
      authService.login.and.returnValue(throwError(() => error));

      component.login();

      expect(component.errorMessage).toBe('Login failed. Please check your username and password.');
    });

    it('should clear previous error and success messages on new login', () => {
      component.errorMessage = 'Previous error';
      component.successMessage = 'Previous success';
      component.username = 'sanskar';
      component.password = 'pwd1';

      component.login();

      expect(component.errorMessage).toBe('');
      expect(component.successMessage).toBe('Login successful! Redirecting...');
    });
  });

  describe('onSubmit', () => {
    it('should prevent default and call login', () => {
      const event = new Event('submit');
      spyOn(event, 'preventDefault');
      spyOn(component, 'login');

      component.onSubmit(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.login).toHaveBeenCalled();
    });
  });
});
