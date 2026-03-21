# Environment Variables Guide

## Overview

This document describes all environment variables used in the Tutorbox application and their configuration requirements.

## Required Variables

### Authentication

```bash
# NextAuth secret key for JWT signing
# REQUIRED in production, has default in development
NEXTAUTH_SECRET=your-secret-key-here

# Email provider for magic links
EMAIL_FROM=noreply@tutorbox.cc
RESEND_API_KEY=re_your_resend_api_key
```

### Database

```bash
# PostgreSQL connection string
# REQUIRED for database operations
DATABASE_URL=postgresql://user:password@localhost:5432/tutorbox
```

## Optional Variables

### Google OAuth (Currently Disabled)

```bash
# Google OAuth credentials (optional, not currently used)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### Paddle Payment Integration

All Paddle-related variables are **optional in development**. The app will run without them, but payment features will be disabled.

```bash
# Paddle API credentials (optional)
PADDLE_API_KEY=
PADDLE_WEBHOOK_SECRET=

# Paddle client token for frontend (optional)
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=

# Paddle environment (optional, defaults to "sandbox")
NEXT_PUBLIC_PADDLE_ENV=sandbox  # or "production"

# Paddle Price IDs (all optional)
NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_CNY=
NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_USD=
NEXT_PUBLIC_PADDLE_PRICE_ID_LEASE_ONETIME_USD=
NEXT_PUBLIC_PADDLE_PRICE_ID_PROMPTER_YEARLY_CNY=
```

**Behavior when missing**:
- If a price ID is not set, the corresponding pricing button will show "定价即将开放" (Pricing coming soon) instead of a checkout button
- The rest of the app continues to work normally
- Webhook processing will skip products with missing price IDs

### Anonymous Trial System

```bash
# Duration of anonymous trial in minutes (optional, defaults to 30)
NEXT_PUBLIC_ANONYMOUS_TRIAL_MINUTES=30
```

### Other Optional Variables

```bash
# Hostname for server-side URL generation (optional, defaults to localhost)
HOSTNAME=http://localhost:3000

# Project planner ID (optional)
NEXT_PUBLIC_PROJECT_PLANNER_ID=

# Skip events flag (optional)
NEXT_PUBLIC_SKIP_EVENTS=
```

## Environment-Specific Configuration

### Development (.env.local)

```bash
# Minimal setup for local development
NEXTAUTH_SECRET=dev-secret-change-in-production
DATABASE_URL=postgresql://user:password@localhost:5432/tutorbox_dev
RESEND_API_KEY=re_your_dev_key
EMAIL_FROM=dev@tutorbox.cc

# Optional: Anonymous trial duration
NEXT_PUBLIC_ANONYMOUS_TRIAL_MINUTES=30

# Optional: Paddle (can be omitted in dev)
# NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=
# NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_CNY=
```

### Production (.env.production)

```bash
# Required
NEXTAUTH_SECRET=strong-random-secret-key-here
DATABASE_URL=postgresql://user:password@prod-host:5432/tutorbox_prod
RESEND_API_KEY=re_your_production_key
EMAIL_FROM=noreply@tutorbox.cc
HOSTNAME=https://tutorbox.cc

# Paddle (required for payment features)
PADDLE_API_KEY=your_paddle_api_key
PADDLE_WEBHOOK_SECRET=your_paddle_webhook_secret
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=your_paddle_client_token
NEXT_PUBLIC_PADDLE_ENV=production

# Paddle Price IDs (set when ready to accept payments)
NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_CNY=pri_01khwk19y0af40zae5fnysj5t3
NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_USD=pri_01kggqdgjrgyryb19xs3veb1js
NEXT_PUBLIC_PADDLE_PRICE_ID_LEASE_ONETIME_USD=pri_01kgrhp2wtthebpgwmn8eh5ssy
NEXT_PUBLIC_PADDLE_PRICE_ID_PROMPTER_YEARLY_CNY=pri_01kgpd9y48fdqfz8pgv5nhgjbk

# Anonymous trial
NEXT_PUBLIC_ANONYMOUS_TRIAL_MINUTES=30
```

## Validation Behavior

The app uses `@t3-oss/env-nextjs` for environment variable validation with the following behavior:

### Strict Validation (Will Block App)
- None currently - all variables are optional or have defaults

### Optional Validation (Won't Block App)
- All Paddle price IDs
- Google OAuth credentials
- Most configuration variables

### Default Values
- `NEXTAUTH_SECRET`: `"dev-nextauth-secret"` (development only)
- `HOSTNAME`: `"http://localhost:3000"`
- `NEXT_PUBLIC_PADDLE_ENV`: `"sandbox"`
- `NEXT_PUBLIC_ANONYMOUS_TRIAL_MINUTES`: `"30"`

## Troubleshooting

### Error: "String must contain at least 1 character(s)"

**Cause**: An environment variable is set to an empty string `""` in your `.env` file.

**Solution**: Either:
1. Remove the variable entirely from `.env`
2. Set it to a valid value
3. The variable is now optional and won't block the app

### Error: "Invalid environment variables"

**Cause**: A required variable is missing or invalid.

**Solution**: Check the error message for which variable is invalid and refer to this guide for the correct format.

### Paddle Buttons Not Showing

**Cause**: Paddle price IDs are not set.

**Expected Behavior**: This is normal in development. The app will show "定价即将开放" (Pricing coming soon) instead of checkout buttons.

**Solution**: Set the appropriate `NEXT_PUBLIC_PADDLE_PRICE_ID_*` variables when ready to accept payments.

## Adding New Environment Variables

When adding new environment variables:

1. **Add to schema** in `src/env.ts`:
   ```typescript
   client: {
     NEXT_PUBLIC_YOUR_NEW_VAR: z.string().optional(),
   }
   ```

2. **Add to runtimeEnv**:
   ```typescript
   runtimeEnv: {
     NEXT_PUBLIC_YOUR_NEW_VAR: process.env.NEXT_PUBLIC_YOUR_NEW_VAR,
   }
   ```

3. **Document here** with:
   - Purpose
   - Required/Optional status
   - Default value (if any)
   - Example value

4. **Add to `.env.example`**:
   ```bash
   # Description of what this does
   NEXT_PUBLIC_YOUR_NEW_VAR=example_value
   ```

## Security Best Practices

1. **Never commit** `.env.local` or `.env.production` to git
2. **Use strong secrets** for `NEXTAUTH_SECRET` in production
3. **Rotate secrets** regularly
4. **Use different values** for development and production
5. **Limit access** to production environment variables
6. **Use environment-specific** API keys (dev vs prod)

## Example .env.example File

```bash
# Copy this file to .env.local and fill in your values

# Authentication (required)
NEXTAUTH_SECRET=change-this-to-a-random-string
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=noreply@tutorbox.cc

# Database (required)
DATABASE_URL=postgresql://user:password@localhost:5432/tutorbox

# Paddle Payment (optional - can be omitted in development)
# PADDLE_API_KEY=
# PADDLE_WEBHOOK_SECRET=
# NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=
# NEXT_PUBLIC_PADDLE_ENV=sandbox
# NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_CNY=
# NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_USD=
# NEXT_PUBLIC_PADDLE_PRICE_ID_LEASE_ONETIME_USD=
# NEXT_PUBLIC_PADDLE_PRICE_ID_PROMPTER_YEARLY_CNY=

# Anonymous Trial (optional)
NEXT_PUBLIC_ANONYMOUS_TRIAL_MINUTES=30

# Other (optional)
# HOSTNAME=http://localhost:3000
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
```

## References

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [T3 Env Documentation](https://env.t3.gg/)
- [Paddle API Documentation](https://developer.paddle.com/)
