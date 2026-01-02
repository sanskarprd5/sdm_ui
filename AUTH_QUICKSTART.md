# Quick Start Guide - JWT Authentication

## Test Login Credentials
```
Username: Bandhu
Password: Pwd1
```

## Backend Requirements
Ensure your backend is running on `http://localhost:8080` with these endpoints:
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

## How It Works

### 1. Login
- Enter username and password
- Click "Sign In"
- Tokens automatically saved
- Redirected to `/arrival`

### 2. Automatic Token Refresh
- Access token expires in **5 minutes**
- Auto-refresh triggers at **4 minutes**
- User stays logged in seamlessly
- No manual action required

### 3. API Calls
All HTTP requests automatically include:
```
Authorization: Bearer {accessToken}
```

If API returns 403/401:
- Token refresh attempted automatically
- Original request retried with new token
- If refresh fails → user logged out

### 4. Logout
Click logout button to:
- Invalidate refresh token on backend
- Clear all local tokens
- Redirect to login page

## Key Files Modified

1. **auth.service.ts** - Authentication logic with auto-refresh
2. **auth.interceptor.ts** - Adds Bearer token to requests, handles 403/401
3. **login.component.ts** - Login UI using real backend
4. **app.config.ts** - HTTP client with interceptor registered

## Testing

### Test Normal Login
1. Start backend server
2. Navigate to `http://localhost:4200/login`
3. Enter: `Bandhu` / `Pwd1`
4. Should redirect to arrival page

### Test Auto Refresh
1. Login successfully
2. Wait 4 minutes
3. Check browser console - should see "Token refreshed automatically"
4. Continue using the app normally

### Test Expired Token
1. Login successfully
2. Wait 5+ minutes without activity
3. Make an API call (navigate to a page)
4. Should auto-refresh and continue

### Test Invalid Credentials
1. Enter wrong username/password
2. Should show "Invalid username or password"

### Test Backend Offline
1. Stop backend server
2. Try to login
3. Should show "Cannot connect to server..."

## LocalStorage Contents

After successful login, check Application → Local Storage:
```
accessToken: "eyJhbGciOiJIUzI1NiJ9..."
refreshToken: "0b30c7cf-f5b7-48f8-8ae4-c293980cec00-..."
tokenType: "Bearer"
tokenExpiry: "1764058405000"
userData: "{"username":"Bandhu","issuer":"sdm-backend-service",...}"
```

## Common Issues

### "Cannot connect to server"
**Solution:** Ensure backend is running on `http://localhost:8080`

### "Invalid username or password"
**Solution:** Verify credentials match backend database

### 403 Forbidden on API calls
**Solution:** 
1. Check if accessToken exists in localStorage
2. Verify backend accepts Bearer token format
3. Check token hasn't expired

### Token not refreshing
**Solution:**
1. Verify refresh endpoint returns new tokens
2. Check console for refresh errors
3. Ensure refresh token is valid

## Architecture Highlights

✅ **Automatic token refresh** - No user disruption  
✅ **Request retry** - Failed 403/401 requests retried with new token  
✅ **Centralized auth** - All logic in auth.service.ts  
✅ **Interceptor pattern** - Consistent token handling  
✅ **Route protection** - AuthGuard prevents unauthorized access  
✅ **Logout cleanup** - Tokens invalidated on backend  

## Next Steps

Once authentication is working:
1. All protected routes automatically require login
2. All API calls automatically include Bearer token
3. Token refresh happens automatically
4. No additional code needed in components

## Documentation

For detailed documentation, see:
- `AUTHENTICATION.md` - Complete authentication flow and API details
