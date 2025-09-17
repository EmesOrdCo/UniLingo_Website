// Simple Node.js server for Stripe integration with Supabase
// This is a basic example - you'll need to set up proper backend infrastructure

require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Initialize Supabase client
const supabase = createClient(
    process.env.PUBLIC_SUPABASE_URL,
    process.env.PUBLIC_SUPABASE_ANON_KEY
);

app.use((req, res, next) => {
    if (req.originalUrl === '/webhook') {
        return next();
    }
    return express.json()(req, res, next);
});
app.use(express.static('.'));

// Function to update user subscription in Supabase
async function updateUserSubscription(userId, plan, status, billingDate = null) {
    try {
        const updateData = {
            payment_tier: plan,
            has_active_subscription: status === 'active',
            updated_at: new Date().toISOString()
        };

        // If this is a new subscription, set the billing date
        if (billingDate) {
            updateData.next_billing_date = billingDate;
        }

        const { data, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId);

        if (error) {
            console.error('Error updating user subscription:', error);
            return false;
        }

        console.log(`Updated user ${userId} subscription: ${plan} - ${status}`);
        return true;
    } catch (error) {
        console.error('Error updating user subscription:', error);
        return false;
    }
}

// Function to calculate next billing date (30 days from now)
function calculateNextBillingDate() {
    const nextBilling = new Date();
    nextBilling.setDate(nextBilling.getDate() + 30);
    return nextBilling.toISOString();
}

// Function to check and process overdue subscriptions
async function processOverdueSubscriptions() {
    try {
        const today = new Date().toISOString();
        
        // Find users with overdue subscriptions
        const { data: overdueUsers, error } = await supabase
            .from('users')
            .select('id, email, payment_tier, next_billing_date')
            .eq('has_active_subscription', true)
            .lt('next_billing_date', today);

        if (error) {
            console.error('Error fetching overdue users:', error);
            return;
        }

        console.log(`Found ${overdueUsers.length} overdue subscriptions`);

        // Process each overdue user
        for (const user of overdueUsers) {
            console.log(`Processing overdue subscription for user ${user.id}`);
            
            // Attempt to charge the user
            const chargeResult = await attemptCharge(user);
            
            if (chargeResult.success) {
                // Payment successful - extend subscription
                const nextBilling = calculateNextBillingDate();
                await updateUserSubscription(user.id, user.payment_tier, 'active', nextBilling);
                console.log(`Successfully renewed subscription for user ${user.id}`);
            } else {
                // Payment failed - deactivate subscription
                await updateUserSubscription(user.id, user.payment_tier, 'inactive');
                console.log(`Deactivated subscription for user ${user.id} due to failed payment`);
                
                // Optional: Send notification email about failed payment
                await sendPaymentFailedNotification(user.email);
            }
        }
    } catch (error) {
        console.error('Error processing overdue subscriptions:', error);
    }
}

// Function to attempt charging a user (placeholder - integrate with your payment processor)
async function attemptCharge(user) {
    try {
        // This is where you'd integrate with Stripe to attempt charging
        // For now, we'll simulate a 90% success rate
        const success = Math.random() > 0.1;
        
        if (success) {
            console.log(`Successfully charged user ${user.id} for ${user.payment_tier} plan`);
            return { success: true };
        } else {
            console.log(`Failed to charge user ${user.id}`);
            return { success: false, reason: 'Payment method declined' };
        }
    } catch (error) {
        console.error('Error attempting charge:', error);
        return { success: false, reason: error.message };
    }
}

// Function to send payment failed notification
async function sendPaymentFailedNotification(email) {
    try {
        // This is where you'd integrate with your email service
        console.log(`Sending payment failed notification to ${email}`);
        // Implement email sending logic here
    } catch (error) {
        console.error('Error sending notification:', error);
    }
}

// Create checkout session endpoint
app.post('/create-checkout-session', async (req, res) => {
    try {
        const { plan, userId, email, successUrl, cancelUrl } = req.body;

        // Define pricing based on plan
        const prices = {
            pro: {
                priceId: 'price_1234567890', // Replace with your actual Stripe price ID
                amount: 999, // £9.99 in pence
                currency: 'gbp'
            },
            premium: {
                priceId: 'price_0987654321', // Replace with your actual Stripe price ID
                amount: 1999, // £19.99 in pence
                currency: 'gbp'
            }
        };

        const selectedPrice = prices[plan];
        if (!selectedPrice) {
            return res.status(400).json({ error: 'Invalid plan selected' });
        }

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: selectedPrice.priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: successUrl,
            cancel_url: cancelUrl,
            customer_email: email,
            metadata: {
                userId: userId,
                plan: plan
            },
            subscription_data: {
                metadata: {
                    userId: userId,
                    plan: plan
                }
            }
        });

        res.json({ id: session.id });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Webhook endpoint for Stripe events
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.log(`Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            console.log('Payment successful for user:', session.metadata.userId);
            
            // Set billing date for first payment (30 days from now)
            const nextBillingDate = calculateNextBillingDate();
            await updateUserSubscription(session.metadata.userId, session.metadata.plan, 'active', nextBillingDate);
            break;
            
        case 'customer.subscription.updated':
            const subscription = event.data.object;
            console.log('Subscription updated:', subscription.id);
            
            // Update subscription status in Supabase
            const userId = subscription.metadata.userId;
            const status = subscription.status === 'active' ? 'active' : 'inactive';
            await updateUserSubscription(userId, subscription.metadata.plan, status);
            break;
            
        case 'customer.subscription.deleted':
            const deletedSubscription = event.data.object;
            console.log('Subscription cancelled:', deletedSubscription.id);
            
            // Mark subscription as cancelled in Supabase
            const cancelledUserId = deletedSubscription.metadata.userId;
            await updateUserSubscription(cancelledUserId, deletedSubscription.metadata.plan, 'cancelled');
            break;
            
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({received: true});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // Run billing check every day at 2 AM
    setInterval(async () => {
        console.log('Running daily billing check...');
        await processOverdueSubscriptions();
    }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
    
    // Also run immediately on startup for testing
    console.log('Running initial billing check...');
    processOverdueSubscriptions();
});

module.exports = app;
