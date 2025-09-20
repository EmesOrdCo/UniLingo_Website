const express = require('express');
const stripe = require('stripe')('sk_live_your_secret_key_here'); // Replace with your secret key
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Create checkout session endpoint
app.post('/create-checkout-session', async (req, res) => {
    try {
        const { priceId, planType, userId, email, successUrl, cancelUrl } = req.body;
        
        // Validate required fields
        if (!priceId || !planType) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            mode: 'subscription',
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                planType: planType,
                userId: userId || 'unknown',
                email: email || 'unknown'
            },
            // Add 7-day free trial for yearly plan
            subscription_data: planType === 'yearly' ? {
                trial_period_days: 7,
            } : undefined,
        });
        
        res.json({ id: session.id });
        
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Webhook endpoint for Stripe events
app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook signature verification failed.`);
    }
    
    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            console.log('Checkout session completed:', event.data.object.id);
            // Handle successful checkout
            break;
        case 'invoice.payment_succeeded':
            console.log('Payment succeeded for subscription:', event.data.object.subscription);
            // Handle successful payment
            break;
        case 'invoice.payment_failed':
            console.log('Payment failed for subscription:', event.data.object.subscription);
            // Handle failed payment
            break;
        case 'customer.subscription.deleted':
            console.log('Subscription cancelled:', event.data.object.id);
            // Handle subscription cancellation
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }
    
    res.json({received: true});
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(port, () => {
    console.log(`Stripe server running on port ${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
});

module.exports = app;