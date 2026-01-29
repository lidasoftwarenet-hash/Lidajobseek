# Deployment Fix Guide - Database Migration Issue

## Problem
The error `The table app.User does not exist in the current database` indicates that Prisma migrations have not been executed on your Render PostgreSQL database. While your schema and migrations exist in the codebase, they haven't been applied to the production database.

## Immediate Fix

### Option 1: Add Build Command in Render Dashboard (RECOMMENDED)

1. **Log into Render Dashboard**
   - Go to https://dashboard.render.com
   - Select your web service

2. **Update Build Command**
   - Go to "Settings" tab
   - Find "Build Command" section
   - Update it to:
   ```bash
   cd backend && npm install && npm run build && npx prisma migrate deploy
   ```
   
3. **Save and Deploy**
   - Click "Save Changes"
   - Trigger a manual deploy or push a new commit

### Option 2: Use Render's Build Script

If you're deploying from the root directory, update the build command to:
```bash
cd backend && npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```

### Option 3: Manual Database Migration (Temporary Fix)

If you need an immediate fix while updating the build process:

1. **Open Render Shell**
   - Go to your web service in Render dashboard
   - Click on "Shell" tab
   - Run the following commands:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

2. **Restart the Service**
   - This should create all tables based on your existing migrations
   - Your login/signup should now work

## Verify the Fix

After running the migrations, check your Render logs. You should see output like:
```
✓ Applied migration: 20260114185335_init_local
✓ Applied migration: 20260115055419_split_interaction_type
✓ Applied migration: 20260115061537_power_features_init
[... all your migrations ...]
```

## Long-term Solution

### Recommended Render Configuration

**render.yaml** (if using Infrastructure as Code):
```yaml
services:
  - type: web
    name: lidajobseek-backend
    env: node
    buildCommand: cd backend && npm install && npx prisma generate && npx prisma migrate deploy && npm run build
    startCommand: cd backend && npm run start:prod
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: your-database-name
          property: connectionString
      - key: JWT_SECRET
        sync: false
```

### Environment Variables Checklist

Ensure these are set in Render:
- ✅ `DATABASE_URL` - Should be automatically set by Render when you connect your PostgreSQL database
- ✅ `JWT_SECRET` - Your JWT secret for authentication
- ✅ `NODE_ENV` - Set to `production`

## Understanding the Fix

1. **`npx prisma generate`** - Generates the Prisma Client based on your schema
2. **`npx prisma migrate deploy`** - Applies all pending migrations to the production database
3. **`npm run build`** - Builds your NestJS application

The order is important:
1. Generate Prisma Client first
2. Run migrations to create tables
3. Build the application

## Package.json Changes Made

I've added the following to your `backend/package.json`:
- **`postbuild`** script: Automatically generates Prisma Client after build
- **`prisma:migrate`** script: Convenience script for running migrations

## Testing After Fix

1. Try to register a new user
2. Try to login with existing credentials
3. Check Render logs for any database errors

## Common Issues

### Issue: "Migration failed to apply"
**Solution**: Check if your DATABASE_URL environment variable is correctly set in Render

### Issue: "Connection timeout"
**Solution**: Ensure your Render PostgreSQL instance is in the same region as your web service

### Issue: "Table already exists"
**Solution**: This means migrations were partially applied. You may need to:
```bash
# In Render shell
cd backend
npx prisma migrate resolve --applied [migration-name]
```

## Prevention

To prevent this issue in the future:
1. Always include `npx prisma migrate deploy` in your build command
2. Test deployments in a staging environment first
3. Monitor Render logs during deployment
4. Keep your local migrations in sync with production

## Need Help?

If the issue persists:
1. Check Render logs for specific error messages
2. Verify DATABASE_URL is correctly formatted
3. Ensure PostgreSQL database is accessible
4. Check if there are any pending migrations locally that haven't been committed