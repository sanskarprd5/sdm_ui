# JWT Authentication Implementation

## Overview
This document describes the JWT-based authentication system with automatic token refresh for the Smart Destination Management application.

## Authentication Flow

### 1. Login Process
```
User enters username & password
         ↓
POST /api/v1/auth/login
         ↓
Backend validates credentials
         ↓
Returns: {
  accessToken,
  refreshToken,
  tokenType: "Bearer",
  accessTokenExpiresInSeconds: 300
}
         ↓
Tokens stored in localStorage
         ↓
Auto-refresh scheduled for 4 minutes
         ↓
User redirected to /arrival
```

### 2. API Request Flow
```
User makes API request
         ↓
Auth Interceptor checks token
         ↓
Adds "Authorization: Bearer {accessToken}"
         ↓
API request sent
         ↓
If 403/401 → Attempt token refresh
If success → Continue normally
```

### 3. Token Refresh Flow
```
Access token expires (5 min)
         ↓
Auto-refresh timer triggers (at 4 min)
OR
API returns 403/401
         ↓
POST /api/v1/auth/refresh
Body: { refreshToken }
         ↓
Backend validates refresh token
         ↓
Returns new accessToken & refreshToken
         ↓
Tokens updated in localStorage
         ↓
Original API request retried with new token
```

### 4. Logout Process
```
User clicks logout
         ↓
POST /api/v1/auth/logout
Body: { refreshToken }
         ↓
Backend invalidates refresh token
         ↓
Clear all tokens from localStorage
         ↓
Redirect to /login
```

## File Structure

```
src/app/
  auth/
    auth.service.ts           ← Authentication business logic
    auth.guard.ts             ← Route protection
    auth.interceptor.ts       ← HTTP request/response handling
  login/
    login.component.ts        ← Login UI
    login.component.html
  app.config.ts               ← HTTP client & interceptor registration
```

## Core Components

### 1. AuthService (`auth.service.ts`)

**Key Methods:**
- `login(username, password)` - Authenticate user
- `refreshToken()` - Get new access token
- `logout()` - End session
- `isLoggedIn()` - Check authentication status
- `getAccessToken()` - Retrieve current access token
- `scheduleTokenRefresh()` - Auto-refresh before expiry

**LocalStorage Keys:**
- `accessToken` - JWT access token
- `refreshToken` - Refresh token for renewals
- `tokenType` - "Bearer"
- `tokenExpiry` - Calculated expiry timestamp
- `userData` - Decoded user information from JWT

### 2. Auth Interceptor (`auth.interceptor.ts`)

**Responsibilities:**
- Add `Authorization: Bearer {token}` header to all API requests
- Skip auth header for `/auth/login` and `/auth/register` endpoints
- Handle 401/403 responses:
  - Prevent multiple simultaneous refresh attempts
  - Queue requests during token refresh
  - Retry failed requests with new token
  - Logout user if refresh fails

**Error Handling:**
```typescript
API returns 403/401
  ↓
Is it /auth/refresh endpoint? → Logout
  ↓
Is token already refreshing? → Queue request
  ↓
Attempt refresh
  ↓
Success? → Retry original request
Failure? → Logout user
```

### 3. Auth Guard (`auth.guard.ts`)

**Purpose:** Protect routes requiring authentication

**Behavior:**
```typescript
User navigates to protected route
  ↓
AuthGuard.canActivate() checks
  ↓
isLoggedIn() = true? → Allow access
isLoggedIn() = false? → Redirect to /login
```

### 4. Login Component (`login.component.ts`)

**Features:**
- Username/password input
- Form validation
- Loading states
- Error handling
- Success messages
- Automatic redirect on successful login

## API Endpoints

### Login
```
POST http://localhost:8080/api/v1/auth/login
Content-Type: application/json

Request:
{
  "username": "Bandhu",
  "password": "Pwd1"
}

Response (200):
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "0b30c7cf-f5b7-48f8-8ae4-c293980cec00...",
  "tokenType": "Bearer",
  "accessTokenExpiresInSeconds": 300
}
```

### Refresh Token
```
POST http://localhost:8080/api/v1/auth/refresh
Content-Type: application/json

Request:
{
  "refreshToken": "0b30c7cf-f5b7-48f8-8ae4-c293980cec00..."
}

Response (200):
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "new-refresh-token...",
  "tokenType": "Bearer",
  "accessTokenExpiresInSeconds": 300
}
```

### Logout
```
POST http://localhost:8080/api/v1/auth/logout
Content-Type: application/json

Request:
{
  "refreshToken": "0b30c7cf-f5b7-48f8-8ae4-c293980cec00..."
}

Response (200):
Success message or empty response
```

## Configuration

### Token Expiry Settings
- **Access Token:** 5 minutes (300 seconds)
- **Auto-refresh trigger:** 4 minutes (1 minute before expiry)
- **Buffer for expiry check:** 30 seconds

### App Config (`app.config.ts`)
```typescript
provideHttpClient(
  withInterceptors([authInterceptor]),
  withFetch()
)
```

## Usage Examples

### Making Authenticated API Calls
```typescript
// The interceptor automatically adds the Bearer token
this.http.get('http://localhost:8080/api/v1/shipments').subscribe({
  next: (data) => console.log(data),
  error: (err) => {
    // Interceptor handles 403/401 automatically
    // If refresh succeeds, request retries
    // If refresh fails, user is logged out
  }
});
```

### Manual Token Refresh
```typescript
this.authService.refreshToken().subscribe({
  next: (response) => {
    console.log('Token refreshed:', response.accessToken);
  },
  error: (err) => {
    console.error('Refresh failed:', err);
  }
});
```

### Logout User
```typescript
this.authService.logout().subscribe({
  complete: () => {
    // User logged out and redirected to /login
  }
});
```

### Check Authentication Status
```typescript
if (this.authService.isLoggedIn()) {
  // User is authenticated
} else {
  // User needs to login
}
```

## Security Features

1. **Automatic Token Refresh:** Prevents user from being logged out during active sessions
2. **Bearer Token Authentication:** Industry-standard authorization header
3. **HTTP-Only Flow:** While tokens are in localStorage (for SPA), production should use httpOnly cookies
4. **Token Expiry Validation:** Client-side checks prevent invalid token usage
5. **Refresh Token Invalidation:** Backend can revoke refresh tokens on logout
6. **Request Retry Logic:** Failed requests due to expired tokens are automatically retried

## Error Handling

### Login Errors
- **401:** Invalid username/password
- **0:** Backend not reachable
- **Other:** Generic error message from API

### API Request Errors
- **401/403:** Automatic token refresh attempted
- **Refresh Fails:** User logged out and redirected to login
- **Network Errors:** Displayed to user

### Edge Cases Handled
- Token refresh already in progress → Queue subsequent requests
- Refresh endpoint fails → Immediate logout
- Token expired before API call → Preventive refresh
- Multiple tabs → Each refreshes independently (can be improved with BroadcastChannel)

## Testing Checklist

- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Access protected route without token
- [ ] Access protected route with valid token
- [ ] Wait 4 minutes to see auto-refresh
- [ ] Make API call after 5 minutes (token expired)
- [ ] Logout successfully
- [ ] Backend server down error handling
- [ ] Invalid refresh token handling

## Future Enhancements

1. **Remember Me:** Extend refresh token lifetime
2. **httpOnly Cookies:** More secure token storage
3. **Multi-tab Sync:** Use BroadcastChannel API to sync tokens
4. **Refresh Token Rotation:** Backend rotates refresh tokens on each use
5. **Session Timeout Warning:** Show warning before auto-logout
6. **Device Management:** List and revoke active sessions
7. **2FA Support:** Two-factor authentication integration

## Troubleshooting

### Issue: "Cannot connect to server"
- **Cause:** Backend not running or CORS not configured
- **Solution:** Start backend server, ensure CORS allows `http://localhost:4200`

### Issue: Token refresh loops infinitely
- **Cause:** Interceptor refreshing on refresh endpoint
- **Solution:** Verify refresh endpoint is excluded in interceptor

### Issue: User logged out unexpectedly
- **Cause:** Refresh token expired or invalidated
- **Solution:** Check backend refresh token lifetime configuration

### Issue: 403 on all API calls
- **Cause:** Token not being added to headers
- **Solution:** Verify interceptor is registered in app.config.ts
