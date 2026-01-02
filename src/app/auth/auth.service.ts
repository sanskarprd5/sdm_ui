import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    accessTokenExpiresInSeconds: number;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface LogoutRequest {
    refreshToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

    private readonly API_BASE_URL = 'http://192.168.0.43:8080/smart-sdm-api/api/v1/auth';
    private readonly ACCESS_TOKEN_KEY = 'accessToken';
    private readonly REFRESH_TOKEN_KEY = 'refreshToken';
    private readonly TOKEN_TYPE_KEY = 'tokenType';
    private readonly TOKEN_EXPIRY_KEY = 'tokenExpiry';
    private readonly USER_DATA_KEY = 'userData';

    private tokenRefreshTimer: any;
    private isRefreshingToken = false;
    private tokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

    constructor(
        private router: Router,
        private http: HttpClient
    ) {
        // Initialize token refresh on service creation if user is logged in
        if (this.isLoggedIn()) {
            this.scheduleTokenRefresh();
        }
    }

    /**
     * Login user with username and password
     */
    login(username: string, password: string): Observable<LoginResponse> {
        const loginRequest: LoginRequest = { username, password };
        
        return this.http.post<LoginResponse>(`${this.API_BASE_URL}/login`, loginRequest)
            .pipe(
                tap(response => {
                    this.storeTokens(response);
                    this.scheduleTokenRefresh();
                    console.log('✓ Login successful');
                }),
                catchError(error => {
                    console.error('Login error:', error);
                    return throwError(() => error);
                })
            );
    }

    /**
     * Refresh access token using refresh token
     */
    refreshToken(): Observable<LoginResponse> {
        const refreshToken = this.getRefreshToken();
        
        if (!refreshToken) {
            return throwError(() => new Error('No refresh token available'));
        }

        this.isRefreshingToken = true;
        const refreshRequest: RefreshTokenRequest = { refreshToken };

        return this.http.post<LoginResponse>(`${this.API_BASE_URL}/refresh`, refreshRequest)
            .pipe(
                tap(response => {
                    this.storeTokens(response);
                    this.isRefreshingToken = false;
                    this.tokenSubject.next(response.accessToken);
                }),
                catchError(error => {
                    this.isRefreshingToken = false;
                    this.logout();
                    return throwError(() => error);
                })
            );
    }

    /**
     * Logout user and invalidate refresh token
     */
    logout(): Observable<any> {
        const refreshToken = this.getRefreshToken();
        
        // Clear tokens first
        this.clearTokenRefreshTimer();
        const logoutObservable = refreshToken 
            ? this.http.post(`${this.API_BASE_URL}/logout`, { refreshToken } as LogoutRequest)
            : new Observable(observer => observer.complete());

        logoutObservable.subscribe({
            complete: () => {
                this.removeTokens();
                this.router.navigate(['/login']);
            },
            error: () => {
                // Even if logout API fails, clear local tokens
                this.removeTokens();
                this.router.navigate(['/login']);
            }
        });

        return logoutObservable;
    }

    /**
     * Store tokens in localStorage
     */
    private storeTokens(response: LoginResponse): void {
        localStorage.setItem(this.ACCESS_TOKEN_KEY, response.accessToken);
        localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
        localStorage.setItem(this.TOKEN_TYPE_KEY, response.tokenType);
        
        // Calculate and store expiry time
        const expiryTime = Date.now() + (response.accessTokenExpiresInSeconds * 1000);
        localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());

        // Decode and store user data from access token
        this.decodeAndStoreUserData(response.accessToken);
    }

    /**
     * Get access token
     */
    getAccessToken(): string | null {
        return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    }

    /**
     * Get refresh token
     */
    getRefreshToken(): string | null {
        return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }

    /**
     * Get token type (Bearer)
     */
    getTokenType(): string {
        return localStorage.getItem(this.TOKEN_TYPE_KEY) || 'Bearer';
    }

    /**
     * Get user data from localStorage
     */
    getUserData(): any {
        const userData = localStorage.getItem(this.USER_DATA_KEY);
        return userData ? JSON.parse(userData) : null;
    }

    /**
     * Remove all tokens from localStorage
     */
    private removeTokens(): void {
        localStorage.removeItem(this.ACCESS_TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        localStorage.removeItem(this.TOKEN_TYPE_KEY);
        localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
        localStorage.removeItem(this.USER_DATA_KEY);
    }

    /**
     * Decode JWT token and extract user data
     */
    private decodeAndStoreUserData(token: string): void {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            
            const decodedToken = JSON.parse(jsonPayload);
            
            // Store user data
            const userData = {
                username: decodedToken.sub, // 'sub' typically contains username
                issuer: decodedToken.iss,
                issuedAt: decodedToken.iat,
                expiresAt: decodedToken.exp
            };
            
            localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
        } catch (e) {
            console.error('Error decoding token:', e);
        }
    }

    /**
     * Check if access token is expired
     */
    isTokenExpired(): boolean {
        const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
        if (!expiryTime) return true;
        
        return Date.now() >= (parseInt(expiryTime) - 30000);
    }

    /**
     * Check if user is logged in
     */
    isLoggedIn(): boolean {
        const accessToken = this.getAccessToken();
        const refreshToken = this.getRefreshToken();
        return !!accessToken && !!refreshToken && !this.isTokenExpired();
    }

    /**
     * Schedule automatic token refresh before expiry
     */
    private scheduleTokenRefresh(): void {
        this.clearTokenRefreshTimer();
        
        const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
        if (!expiryTime) return;

        const expiresIn = parseInt(expiryTime) - Date.now();
        // Refresh 1 minute before expiry, or immediately if already expired
        const refreshIn = Math.max(expiresIn - 60000, 0);

        this.tokenRefreshTimer = setTimeout(() => {
            if (this.getRefreshToken() && !this.isRefreshingToken) {
                this.refreshToken().subscribe({
                    next: () => {
                        console.log('Token refreshed automatically');
                        this.scheduleTokenRefresh(); // Schedule next refresh
                    },
                    error: (error) => {
                        console.error('Auto token refresh failed:', error);
                    }
                });
            }
        }, refreshIn);
    }

    /**
     * Clear token refresh timer
     */
    private clearTokenRefreshTimer(): void {
        if (this.tokenRefreshTimer) {
            clearTimeout(this.tokenRefreshTimer);
            this.tokenRefreshTimer = null;
        }
    }

    /**
     * Get token observable for retry queue
     */
    getTokenObservable(): Observable<string | null> {
        return this.tokenSubject.asObservable();
    }

    /**
     * Check if currently refreshing token
     */
    isRefreshing(): boolean {
        return this.isRefreshingToken;
    }
}
