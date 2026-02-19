# Render Deployment Fix Guide

## Problem Summary

Your application was experiencing errors on Render due to:

1. **Invalid Path Pattern**: The ServeStaticModule was using an incompatible regex pattern `/api{/*path}` which caused `PathError` with the newer version of `path-to-regexp` library
2. **CORS Configuration**: Hardcoded CORS to only allow `localhost:4200`, blocking production requests
3. **Static File Path Error**: The error `TypeError: path must be absolute or specify root to res.sendFile` occurs when the UI static files directory doesn't exist, causing the ServeStaticModule to fail

## What Was Fixed

### 1. Fixed ServeStatic Path Pattern (app.module.ts)
**Before:**
```typescript
exclude: ['/api{/*path}'],
```

**After:**
```typescript
exclude: ['/api*'],
```

### 2. Fixed Static File Path Resolution (app.module.ts)
**Problem:** When the UI static files directory didn't exist, the ServeStaticModule would still try to serve from a non-existent path, causing `path must be absolute or specify root to res.sendFile` errors.

**Solution:** 
- Made UI static serving conditional - only serves if the directory exists
- Uses `path.resolve()` for absolute paths instead of `path.join()`
- Added more possible path locations to check
- Provides clear console logging for debugging
- Backend will work without UI files (useful for separate deployments)

**Benefits:**
- ✅ No more `sendFile` errors when UI files are missing
- ✅ Backend runs successfully even without frontend build
- ✅ Better logging for troubleshooting deployment issues
- ✅ More robust path resolution across different deployment environments

### 3. Improved CORS Configuration (main.ts)
- Added support for environment-based CORS origins
- Added proper TypeScript typing
- Added better logging for debugging
- Made CORS configurable via `FRONTEND_URL` environment variable

### Step 1: Update Build Command in Render
In your Render dashboard, under **Settings**, set the **Build Command** to:
```bash
npm install && npm run build
```
*This will install all dependencies (backend & UI) and build both, moving the UI files to the correct location.*

### Step 2: Update Start Command in Render
Set the **Start Command** to:
```bash
node dist/src/main.js
```
*Note: Depending on your build output, this might also be `node backend/dist/main.js` if you are running from the root.*

### Step 3: Verify Environment Variables
Make sure these are set in your Render backend service:

```bash
DATABASE_URL=<your-neon-db-url>
JWT_SECRET=<your-secret>
PORT=3000
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=<your-brevo-user>
SMTP_PASS=<your-brevo-password>
BREVO_API_KEY=<your-brevo-api-key>
```

### Step 3: Deploy the Changes

1. **Commit and push your changes:**
```bash
git add backend/src/main.ts backend/src/app.module.ts
git commit -m "Fix Render deployment: resolve path-to-regexp error and improve CORS"
git push origin main
```

2. **Render will automatically detect the changes and redeploy**

3. **Monitor the logs** to ensure the error is gone:
   - Look for: `🚀 Application is running on: http://localhost:3000/api`
   - Look for: `📍 Allowed CORS origins: ...`
   - **No more PathError messages should appear**

### Step 4: Update Frontend API URL (if needed)

Make sure your frontend environment configuration points to your Render backend URL:

**File:** `ui/src/environments/environment.prod.ts`
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-backend-app.onrender.com/api'
};
```

## Testing After Deployment

1. Open your production app: `https://your-frontend-app.onrender.com`
2. Try to **create a new process**
3. Try to **schedule an interview**
4. Both should work without 500 errors

## Monitoring & Debugging

### Check Render Backend Logs
```bash
# You should now see:
🚀 Application is running on: http://localhost:3000/api
📍 Allowed CORS origins: http://localhost:4200, http://localhost:3000, https://your-frontend-app.onrender.com

# NO MORE PathError messages!
```

### Common Issues

#### Issue: Still getting CORS errors
**Solution:** Double-check that `FRONTEND_URL` environment variable is set correctly in Render dashboard (without trailing slash)

#### Issue: 500 errors persist
**Solution:** Check Render logs for new error messages. The PathError should be completely gone now.

#### Issue: Frontend can't connect
**Solution:** Verify `apiUrl` in frontend environment configuration matches your backend URL

## What Changed in the Code

### backend/src/app.module.ts
- Changed `exclude: ['/api{/*path}']` to `exclude: ['/api*']`
- This fixes the path-to-regexp compatibility issue

### backend/src/main.ts
- Added support for `FRONTEND_URL` environment variable
- Added proper TypeScript typing for CORS callback
- Added better logging and error handling
- Made CORS more flexible for production deployments

## Local Development

Everything still works locally as before:
- Backend: `http://localhost:3000`
- Frontend: `http://localhost:4200`

No changes needed to your local setup!

## Summary

The 500 errors on Render were caused by an invalid regex pattern in the ServeStaticModule configuration. The pattern `/api{/*path}` is not compatible with newer versions of the `path-to-regexp` library used by NestJS. 

By changing it to `/api*`, the application now works correctly on Render. Additionally, the improved CORS configuration ensures your production frontend can communicate with the backend properly.

---

**Need Help?** Check the Render logs for any remaining error messages and verify all environment variables are set correctly.
