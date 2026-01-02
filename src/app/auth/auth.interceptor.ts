// auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { throwError } from 'rxjs';

const RETRY_HEADER = 'X-Auth-Retry-Attempt';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Skip adding token for auth endpoints
  if (req.url.includes('/auth/login') || req.url.includes('/auth/register')) {
    return next(req);
  }

  // Get access token
  const accessToken = authService.getAccessToken();
  const tokenType = authService.getTokenType();

  // Skip adding bypass mock tokens (they won't work with real backend)
  const isBypassLogin = accessToken === 'bypass-mock-access-token';
  if (isBypassLogin) {
    console.log(`→ ${req.method} ${req.url} (bypass mode - no token)`);
    return next(req);
  }

  // Clone request and add authorization header if token exists
  let authReq = req;
  if (accessToken) {
    const authHeader = `${tokenType} ${accessToken}`;
    authReq = req.clone({
      setHeaders: {
        Authorization: authHeader
      }
    });
    console.log(`→ ${req.method} ${req.url}`);
    console.log(`  Authorization: ${authHeader.substring(0, 50)}...`);
  }

  // Handle request and catch 401/403 errors
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized or 403 Forbidden
      if (error.status === 401 || error.status === 403) {
        console.error(`✗ ${error.status} ${error.message}`);
        
        // Don't retry refresh endpoint itself
        if (req.url.includes('/auth/refresh')) {
          console.error('✗ Refresh token invalid, logging out');
          authService.logout();
          return throwError(() => error);
        }

        // Check if this is already a retry attempt
        const isRetry = req.headers.has(RETRY_HEADER);
        if (isRetry) {
          console.warn('⚠ Retry after token refresh still failed - endpoint may have auth issues');
          console.warn('⚠ Not logging out - keeping session active');
          return throwError(() => error);
        }

        // If already refreshing, wait for new token
        if (authService.isRefreshing()) {
          return authService.getTokenObservable().pipe(
            filter(token => token !== null),
            take(1),
            switchMap(token => {
              const retryReq = req.clone({
                setHeaders: {
                  Authorization: `${authService.getTokenType()} ${token}`,
                  [RETRY_HEADER]: 'true'
                }
              });
              return next(retryReq);
            })
          );
        }

        // Try to refresh token
        console.log('↻ Refreshing token...');
        return authService.refreshToken().pipe(
          switchMap((response) => {
            console.log('✓ Token refreshed');
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `${response.tokenType} ${response.accessToken}`,
                [RETRY_HEADER]: 'true'
              }
            });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            console.error('✗ Token refresh API call failed, logging out');
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }

      return throwError(() => error);
    })
  );
};

