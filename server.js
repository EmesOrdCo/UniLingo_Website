const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();
const port = process.env.PORT || 3000;

// Load environment variables
require('dotenv').config();

// Initialize Supabase
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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
        if (!priceId || !planType || !userId || !email) {
            return res.status(400).json({ error: 'Missing required fields: priceId, planType, userId, and email are required' });
        }

        // Verify user exists in database
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, email')
            .eq('id', userId)
            .eq('email', email)
            .single();

        if (userError || !userData) {
            console.error('User verification failed:', userError);
            return res.status(400).json({ error: 'Invalid user credentials' });
        }
        
        // Create or retrieve Stripe customer
        let customer;
        try {
            // Check if customer already exists
            const customers = await stripe.customers.list({
                email: email,
                limit: 1
            });

            if (customers.data.length > 0) {
                customer = customers.data[0];
            } else {
                // Create new customer
                customer = await stripe.customers.create({
                    email: email,
                    metadata: {
                        userId: userId,
                        planType: planType
                    }
                });
            }
        } catch (stripeError) {
            console.error('Stripe customer creation failed:', stripeError);
            return res.status(500).json({ error: 'Failed to create customer account' });
        }
        
        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer: customer.id,
            line_items: [{
                price: priceId,
                    quantity: 1,
            }],
            mode: 'subscription',
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                planType: planType,
                userId: userId,
                email: email,
                customerId: customer.id
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
            handleCheckoutCompleted(event.data.object);
            break;
        case 'invoice.payment_succeeded':
            console.log('Payment succeeded for subscription:', event.data.object.subscription);
            handlePaymentSucceeded(event.data.object);
            break;
        case 'invoice.payment_failed':
            console.log('Payment failed for subscription:', event.data.object.subscription);
            handlePaymentFailed(event.data.object);
            break;
        case 'customer.subscription.deleted':
            console.log('Subscription cancelled:', event.data.object.id);
            handleSubscriptionCancelled(event.data.object);
            break;
        case 'customer.subscription.updated':
            console.log('Subscription updated:', event.data.object.id);
            handleSubscriptionUpdated(event.data.object);
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({received: true});
});

// Webhook handler functions
async function handleCheckoutCompleted(session) {
    try {
        const { userId, customerId, planType, email } = session.metadata;
        
        if (!userId || !customerId) {
            console.error('Missing metadata in checkout session:', session.id);
            return;
        }

        // Update user with Stripe customer ID
        const { error: updateError } = await supabase
            .from('users')
            .update({ 
                stripe_customer_id: customerId,
                payment_tier: 'premium',
                has_active_subscription: true
            })
            .eq('id', userId);

        if (updateError) {
            console.error('Failed to update user with customer ID:', updateError);
        } else {
            console.log(`Updated user ${userId} with customer ID ${customerId}`);
        }

    } catch (error) {
        console.error('Error handling checkout completed:', error);
    }
}

async function handlePaymentSucceeded(invoice) {
    try {
        const subscriptionId = invoice.subscription;
        
        if (!subscriptionId) {
            console.error('No subscription ID in invoice:', invoice.id);
            return;
        }

        // Get subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const customerId = subscription.customer;
        
        // Find user by Stripe customer ID
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single();

        if (userError || !userData) {
            console.error('User not found for customer ID:', customerId);
            return;
        }

        // Update subscription details
        const { error: updateError } = await supabase
            .from('users')
            .update({
                next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
                has_active_subscription: subscription.status === 'active' || subscription.status === 'trialing'
            })
            .eq('id', userData.id);

        if (updateError) {
            console.error('Failed to update subscription details:', updateError);
        } else {
            console.log(`Updated subscription for user ${userData.id}`);
        }

    } catch (error) {
        console.error('Error handling payment succeeded:', error);
    }
}

async function handlePaymentFailed(invoice) {
    try {
        const subscriptionId = invoice.subscription;
        
        if (!subscriptionId) {
            console.error('No subscription ID in failed invoice:', invoice.id);
            return;
        }

        // Get subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const customerId = subscription.customer;
        
        // Find user by Stripe customer ID
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single();

        if (userError || !userData) {
            console.error('User not found for customer ID:', customerId);
            return;
        }

        // Update subscription status
        const { error: updateError } = await supabase
            .from('users')
            .update({
                has_active_subscription: false
            })
            .eq('id', userData.id);

        if (updateError) {
            console.error('Failed to update failed payment status:', updateError);
        } else {
            console.log(`Updated failed payment status for user ${userData.id}`);
        }

    } catch (error) {
        console.error('Error handling payment failed:', error);
    }
}

async function handleSubscriptionCancelled(subscription) {
    try {
        const customerId = subscription.customer;
        
        // Find user by Stripe customer ID
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single();

        if (userError || !userData) {
            console.error('User not found for customer ID:', customerId);
            return;
        }

        // Update subscription status
        const { error: updateError } = await supabase
            .from('users')
            .update({
                has_active_subscription: false,
                payment_tier: 'free'
            })
            .eq('id', userData.id);

        if (updateError) {
            console.error('Failed to update cancelled subscription:', updateError);
        } else {
            console.log(`Updated cancelled subscription for user ${userData.id}`);
        }

    } catch (error) {
        console.error('Error handling subscription cancelled:', error);
    }
}

async function handleSubscriptionUpdated(subscription) {
    try {
        const customerId = subscription.customer;
        
        // Find user by Stripe customer ID
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single();

        if (userError || !userData) {
            console.error('User not found for customer ID:', customerId);
            return;
        }

        // Update subscription details
        const { error: updateError } = await supabase
            .from('users')
            .update({
                next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
                has_active_subscription: subscription.status === 'active' || subscription.status === 'trialing'
            })
            .eq('id', userData.id);

        if (updateError) {
            console.error('Failed to update subscription:', updateError);
        } else {
            console.log(`Updated subscription for user ${userData.id}`);
        }

    } catch (error) {
        console.error('Error handling subscription updated:', error);
    }
}

// Cancel subscription endpoint
app.post('/cancel-subscription', async (req, res) => {
    try {
        const { subscriptionId, customerId } = req.body;
        
        if (!subscriptionId) {
            return res.status(400).json({ error: 'Subscription ID is required' });
        }
        
        // Cancel the subscription
        const subscription = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true
        });
        
        res.json({ 
            success: true, 
            subscription: {
                id: subscription.id,
                status: subscription.status,
                cancel_at_period_end: subscription.cancel_at_period_end,
                current_period_end: subscription.current_period_end
            }
        });
        
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        res.status(500).json({ error: error.message });
    }
});

// Reactivate subscription endpoint
app.post('/reactivate-subscription', async (req, res) => {
    try {
        const { subscriptionId, customerId } = req.body;
        
        if (!subscriptionId) {
            return res.status(400).json({ error: 'Subscription ID is required' });
        }
        
        // Reactivate the subscription
        const subscription = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: false
        });
        
        res.json({ 
            success: true, 
            subscription: {
                id: subscription.id,
                status: subscription.status,
                cancel_at_period_end: subscription.cancel_at_period_end,
                current_period_end: subscription.current_period_end
            }
        });
        
    } catch (error) {
        console.error('Error reactivating subscription:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get subscription details endpoint
app.get('/subscription/:subscriptionId', async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        res.json({
            id: subscription.id,
            status: subscription.status,
            cancel_at_period_end: subscription.cancel_at_period_end,
            current_period_end: subscription.current_period_end,
            current_period_start: subscription.current_period_start,
            plan: subscription.items.data[0].price.nickname || 'Monthly',
            amount: `£${(subscription.items.data[0].price.unit_amount / 100).toFixed(2)}`
        });
        
    } catch (error) {
        console.error('Error retrieving subscription:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get user account data endpoint
app.get('/account/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // In production, you would fetch this from your database
        // For now, return mock data with real Stripe subscription if available
        const mockAccountData = {
            id: userId,
            email: 'user@example.com',
            memberSince: '2024-01-15',
            stats: {
                studyStreak: 7,
                totalCards: 156,
                studyTime: '24h',
                level: 5
            },
            settings: {
                notifications: true,
                reminders: true,
                darkMode: true
            }
        };
        
        res.json(mockAccountData);
        
    } catch (error) {
        console.error('Error retrieving account data:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update user settings endpoint
app.post('/account/:userId/settings', async (req, res) => {
    try {
        const { userId } = req.params;
        const { settings } = req.body;
        
        // In production, you would update this in your database
        console.log(`Updating settings for user ${userId}:`, settings);
        
        res.json({ 
            success: true, 
            message: 'Settings updated successfully',
            settings: settings
        });
        
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get user subscription data endpoint
app.get('/api/user-subscription/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // First, get user data from Supabase users table
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('stripe_customer_id')
            .eq('id', userId)
            .single();
        
        if (userError) {
            console.error('Error fetching user from database:', userError);
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Get user auth data for email and created_at
        const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
        
        if (authError) {
            console.error('Error fetching auth data:', authError);
            return res.status(404).json({ error: 'User auth data not found' });
        }
        
        const stripeCustomerId = userData.stripe_customer_id;
        
        let subscriptionData = {
            hasSubscription: false,
            status: 'none',
            plan: null,
            amount: null,
            nextBilling: null,
            customerId: null,
            subscriptionId: null
        };
        
        if (stripeCustomerId) {
            try {
                // Fetch customer from Stripe
                const customer = await stripe.customers.retrieve(stripeCustomerId);
                
                // Get active subscriptions for this customer
                const subscriptions = await stripe.subscriptions.list({
                    customer: stripeCustomerId,
                    status: 'all',
                    limit: 1
                });
                
                if (subscriptions.data.length > 0) {
                    const subscription = subscriptions.data[0];
                    const price = await stripe.prices.retrieve(subscription.items.data[0].price.id);
                    
                    subscriptionData = {
                        hasSubscription: true,
                        status: subscription.status,
                        plan: price.nickname || (price.unit_amount === 999 ? 'Monthly' : 'Yearly'),
                        amount: `£${(price.unit_amount / 100).toFixed(2)}`,
                        nextBilling: new Date(subscription.current_period_end * 1000).toISOString(),
                        customerId: stripeCustomerId,
                        subscriptionId: subscription.id
                    };
                }
            } catch (stripeError) {
                console.error('Error fetching Stripe data:', stripeError);
                // Return user data without subscription info
            }
        }
        
        // Return combined user and subscription data
        res.json({
            user: {
                id: authData.user.id,
                email: authData.user.email,
                memberSince: authData.user.created_at
            },
            subscription: subscriptionData
        });
        
    } catch (error) {
        console.error('Error fetching subscription data:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update user with Stripe customer ID endpoint
app.post('/api/update-stripe-customer', async (req, res) => {
    try {
        const { userId, customerId } = req.body;
        
        if (!userId || !customerId) {
            return res.status(400).json({ error: 'User ID and Customer ID are required' });
        }
        
        // Update user with Stripe customer ID
        const { data, error } = await supabase
            .from('users')
            .update({ stripe_customer_id: customerId })
            .eq('id', userId)
            .select();
        
        if (error) {
            console.error('Error updating user with Stripe customer ID:', error);
            return res.status(500).json({ error: error.message });
        }
        
        res.json({ 
            success: true, 
            message: 'Stripe customer ID updated successfully',
            data: data
        });
        
    } catch (error) {
        console.error('Error updating Stripe customer ID:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/create-portal-session', async (req, res) => {
    try {
        const { customerId, returnUrl } = req.body;
        
        if (!customerId) {
            return res.status(400).json({ error: 'Customer ID is required' });
        }
        
        // Create a portal session
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl || `${process.env.FRONTEND_URL || 'https://unilingo.co.uk'}/manage-account.html`,
        });
        
        res.json({ 
            success: true, 
            url: portalSession.url 
        });
        
    } catch (error) {
        console.error('Error creating portal session:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Supabase configuration endpoint
app.get('/api/config', (req, res) => {
    res.json({
        supabaseUrl: supabaseUrl,
        supabaseKey: supabaseKey
    });
});

// Test Supabase connection endpoint
app.post('/api/test-supabase', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('Testing Supabase connection...');
        console.log('URL:', supabaseUrl);
        console.log('Key length:', supabaseKey ? supabaseKey.length : 'undefined');
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            console.error('Supabase error:', error);
            return res.status(400).json({ 
                error: error.message,
                code: error.status,
                details: error
            });
        }
        
        res.json({ 
            success: true, 
            user: data.user,
            message: 'Supabase connection working'
        });
        
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: error.message,
            stack: error.stack
        });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Stripe server running on port ${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
});

module.exports = app;