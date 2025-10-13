# UniLingo Subscription Flow

A complete subscription flow for UniLingo app with Stripe integration, designed to handle user signups, plan selection, payment processing, and app redirection.

## 🚀 Features

- **Subscription Page**: Clean, responsive design for plan selection
- **Stripe Integration**: Secure payment processing with Stripe Checkout
- **Success Page**: Confirmation page with automatic app redirection
- **Mobile Responsive**: Works perfectly on all devices
- **Deep Linking**: Redirects back to UniLingo app after payment

## 📁 Files Created

- `subscription.html` - Main subscription page with plan selection
- `success.html` - Payment success page with app redirection
- `server.js` - Backend server for Stripe integration
- `package.json` - Node.js dependencies

## 🛠 Setup Instructions

### 1. Stripe Account Setup

1. **Create Stripe Account**: Go to [stripe.com](https://stripe.com) and create an account
2. **Get API Keys**: 
   - Publishable Key: `pk_test_...` (for frontend)
   - Secret Key: `sk_test_...` (for backend)
3. **Create Products**: Create subscription products in Stripe Dashboard
4. **Get Price IDs**: Copy the price IDs for Pro ($13.99) and Premium ($139.99) plans

### 2. Supabase Setup

1. **Create Supabase Project**: Go to [supabase.com](https://supabase.com) and create a project
2. **Get API Keys**: 
   - Project URL: `https://your-project.supabase.co`
   - Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. **Create Users Table**: Ensure your users table has these columns:
   ```sql
   CREATE TABLE users (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     email TEXT UNIQUE NOT NULL,
     payment_tier TEXT DEFAULT 'free',
     has_active_subscription BOOLEAN DEFAULT false,
     next_billing_date TIMESTAMP WITH TIME ZONE,
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

### 3. Update Stripe Configuration

In `subscription.html`, replace the placeholder:
```javascript
const stripe = Stripe('pk_test_your_stripe_publishable_key_here');
```

In `server.js`, update the price IDs:
```javascript
const prices = {
    pro: {
        priceId: 'price_1234567890', // Your actual Pro plan price ID
        amount: 1399, // £13.99 in pence
        currency: 'gbp'
    },
    premium: {
        priceId: 'price_0987654321', // Your actual Premium plan price ID
        amount: 13999, // £139.99 in pence
        currency: 'gbp'
    }
};
```

### 4. Backend Setup

```bash
# Install dependencies
npm install

# Set environment variables
export STRIPE_SECRET_KEY="sk_test_your_secret_key_here"
export STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Start server
npm start
```

### 5. App Deep Linking

Update the deep link URL in `success.html`:
```javascript
const appUrl = `unilingo://subscription-success?user_id=${userId}&plan=${plan}`;
```

Replace `unilingo://` with your actual app's URL scheme.

## 🔄 User Flow

1. **App Signup**: User completes signup in UniLingo app
2. **Redirect to Website**: App redirects to `subscription.html?user_id=123&email=user@example.com&plan=pro`
3. **Plan Selection**: User selects subscription plan
4. **Stripe Checkout**: Redirected to Stripe for secure payment
5. **Payment Success**: Redirected to `success.html` with confirmation
6. **App Return**: Automatic redirect back to UniLingo app

## 🎨 Customization

### Styling
- All styles are inline in the HTML files for easy customization
- Uses your existing UniLingo color scheme (#6366f1)
- Fully responsive design

### Plans
- Easy to add/remove/modify subscription plans
- Update pricing in both frontend and backend
- Modify features list for each plan

### URLs
- Update success/cancel URLs in `server.js`
- Modify deep link schemes for your app
- Customize redirect timing

## 🔒 Security Notes

- Never expose Stripe secret keys in frontend code
- Use environment variables for sensitive data
- Implement proper webhook signature verification
- Validate all user inputs on the backend

## 📱 Mobile Considerations

- Deep linking works on both iOS and Android
- Fallback handling if app isn't installed
- Responsive design for all screen sizes
- Touch-friendly button sizes

## 🚀 Deployment

1. **Frontend**: Deploy HTML files to your web server
2. **Backend**: Deploy Node.js server to your hosting platform
3. **Environment**: Set up environment variables
4. **Webhooks**: Configure Stripe webhooks to point to your server
5. **Testing**: Test the complete flow in Stripe test mode

## 📞 Support

For questions or issues with this subscription flow, contact EmesOrd.

---

**Created by EmesOrd for UniLingo** 🚀
