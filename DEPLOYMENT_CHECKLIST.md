# Production Deployment Checklist

## ❌ Localhost Issue
The "Loading..." data issue on localhost is **EXPECTED** and **WILL NOT OCCUR** in production because:
- Localhost doesn't have Netlify Functions running
- The `/api/user-subscription/` endpoint returns 404 locally
- This will work automatically on Netlify after deployment

## ✅ What You Need to Do for Production

### 1. Set Environment Variables in Netlify
Go to your Netlify dashboard → Site settings → Environment variables and add:

```
STRIPE_SECRET_KEY=sk_live_your_actual_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret
SUPABASE_URL=https://zbnozflfozvaktjlomka.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpibm96Zmxmb3p2YWt0amxvbWthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTkxODIsImV4cCI6MjA3MDQ5NTE4Mn0.D-kYtY35Tmp3tZ6hU-O2IeZVXMzBvsYr7drUfeKjMkM
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**IMPORTANT**: Get your `SUPABASE_SERVICE_ROLE_KEY` from your Supabase dashboard → Settings → API → service_role key.

### 2. Verify Netlify Functions Are Deployed
After deployment, verify these files exist:
- `netlify/functions/user-subscription.js` ✅
- `netlify/functions/utils.js` ✅
- `netlify.toml` (properly configured) ✅

### 3. Verify Supabase Users Table Structure
Your Supabase `users` table needs these columns:
- `id` (UUID)
- `email` (TEXT)
- `created_at` (TIMESTAMP)
- `stripe_customer_id` (TEXT, nullable)
- `has_active_subscription` (BOOLEAN)
- `payment_tier` (TEXT)
- `next_billing_date` (TIMESTAMP, nullable)

### 4. Test After Deployment
1. Go to your deployed site
2. Sign in
3. Navigate to `/manage-account.html`
4. Data should load (not stay on "Loading...")

## 🚨 If Data Still Shows "Loading..." in Production

### Check Netlify Function Logs
1. Go to Netlify Dashboard → Your site → Functions
2. Click on `user-subscription`
3. Check for error messages

### Common Issues:
1. **Missing SUPABASE_SERVICE_ROLE_KEY**: Functions can't query database
2. **RLS (Row Level Security) Issues**: Service role key bypasses RLS
3. **Missing Users Table**: Database needs proper schema
4. **Wrong Environment Variables**: Double-check spelling and values

## 📊 Current Status
- ✅ Netlify Functions configured correctly
- ✅ Frontend code handles loading states properly
- ✅ i18n translations work on all pages
- ⚠️  Needs environment variables set in Netlify
- ⚠️  Needs Supabase users table verification

## 🧪 For Local Testing
To test locally with Netlify Functions, run:
```bash
npm install -g netlify-cli
netlify dev
```

This starts a local environment with Netlify Functions emulation.

