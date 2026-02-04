# Premium Features Implementation Guide

This guide explains how the premium features system works and how to add new premium features.

## Overview

The system now includes a pricing plan feature that allows you to restrict certain features to premium users. Each user has a `pricingPlan` field that can be:
- `free` - Default plan with limited features
- `premium` - Paid plan with additional features
- `enterprise` - Full-featured plan

## Architecture

### Backend Components

1. **User Entity** (`backend/src/users/user.entity.ts`)
   - Added `pricingPlan` field to store user's subscription level

2. **Premium Guard** (`backend/src/auth/premium.guard.ts`)
   - Validates if a user has premium access before allowing endpoint execution
   - Throws ForbiddenException if user doesn't have required plan

3. **Requires Premium Decorator** (`backend/src/auth/requires-premium.decorator.ts`)
   - Decorator to mark endpoints that require premium access
   - Usage: `@RequiresPremium()`

4. **Auth Service** (`backend/src/auth/auth.service.ts`)
   - Returns `pricingPlan` in login response
   - Includes `pricingPlan` in JWT token payload

5. **JWT Strategy** (`backend/src/auth/jwt.strategy.ts`)
   - Decodes JWT and includes `pricingPlan` in request user object

### Frontend Components

1. **Auth Service** (`ui/src/app/services/auth.service.ts`)
   - `isPremiumUser()` - Check if current user has premium access
   - `getPricingPlan()` - Get current user's pricing plan
   - `checkPremiumAccess(featureName)` - Show alert and return false if user doesn't have premium

2. **UI Components**
   - Buttons/features that require premium show lock icon and "(Premium)" label
   - Disabled state applied when user is not premium
   - Special CSS styling for premium-required features

## How to Add a New Premium Feature

### Backend

1. Add the decorators to your endpoint:

```typescript
import { RequiresPremium } from '../auth/requires-premium.decorator';
import { PremiumGuard } from '../auth/premium.guard';

@Post('your-endpoint')
@UseGuards(AuthGuard('jwt'), PremiumGuard)
@RequiresPremium()
async yourPremiumFeature(@Request() req) {
  // Your premium feature logic
}
```

### Frontend

1. In your component TypeScript file:

```typescript
import { AuthService } from '../../services/auth.service';

export class YourComponent {
  constructor(private authService: AuthService) {}

  get isPremiumUser(): boolean {
    return this.authService.isPremiumUser();
  }

  yourPremiumAction(): void {
    if (!this.authService.checkPremiumAccess('Feature Name')) {
      return;
    }
    
    // Your premium feature logic
  }
}
```

2. In your component HTML:

```html
<button 
  (click)="yourPremiumAction()" 
  [disabled]="!isPremiumUser"
  [class.premium-required]="!isPremiumUser">
  <span *ngIf="isPremiumUser">✨ Feature Name</span>
  <span *ngIf="!isPremiumUser">🔒 Feature Name (Premium)</span>
</button>
```

3. In your component CSS:

```css
.premium-required {
  background-color: #f0ad4e;
  opacity: 0.7;
  cursor: not-allowed;
}

.premium-required:hover {
  background-color: #ec971f;
  opacity: 0.8;
}
```

## Database Migration

To add the pricing plan to existing users, run the SQL script:

```bash
psql -U your_username -d your_database -f backend/SQL_ADD_PRICING_PLAN.sql
```

Or manually run the SQL in your database:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS pricing_plan VARCHAR(50) DEFAULT 'free';
UPDATE users SET pricing_plan = 'free' WHERE pricing_plan IS NULL;
```

## Testing Premium Features

To test premium features, you can manually update a user's pricing plan in the database:

```sql
UPDATE users SET pricing_plan = 'premium' WHERE email = 'your-test-email@example.com';
```

Then log in again to get a new JWT token with the updated pricing plan.

## Current Premium Features

1. **AI CV Generation** - Generate CV using AI (Profile CV page)
   - Frontend: `ui/src/app/pages/profile-cv/profile-cv.component.ts`
   - Backend: `backend/src/profiles/profiles.controller.ts` - `generateCV` endpoint

## Future Enhancements

Consider adding:
- Subscription management page
- Stripe/payment integration
- Plan comparison table
- Feature usage limits for free users
- Trial periods
- Admin panel to manage user subscriptions