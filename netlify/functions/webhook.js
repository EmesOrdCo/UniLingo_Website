const { stripe, supabase, handleCORS, createResponse, createErrorResponse } = require('./utils');

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
        payment_tier: planType, // 'monthly' or 'yearly'
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
        has_active_subscription: false
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

exports.handler = async (event) => {
  // Handle CORS
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return createErrorResponse(400, 'Webhook signature verification failed.');
  }

  // Handle the event
  switch (stripeEvent.type) {
    case 'checkout.session.completed':
      console.log('Checkout session completed:', stripeEvent.data.object.id);
      await handleCheckoutCompleted(stripeEvent.data.object);
      break;
    case 'invoice.payment_succeeded':
      console.log('Payment succeeded for subscription:', stripeEvent.data.object.subscription);
      await handlePaymentSucceeded(stripeEvent.data.object);
      break;
    case 'invoice.payment_failed':
      console.log('Payment failed for subscription:', stripeEvent.data.object.subscription);
      await handlePaymentFailed(stripeEvent.data.object);
      break;
    case 'customer.subscription.deleted':
      console.log('Subscription cancelled:', stripeEvent.data.object.id);
      await handleSubscriptionCancelled(stripeEvent.data.object);
      break;
    case 'customer.subscription.updated':
      console.log('Subscription updated:', stripeEvent.data.object.id);
      await handleSubscriptionUpdated(stripeEvent.data.object);
      break;
    default:
      console.log(`Unhandled event type ${stripeEvent.type}`);
  }

  return createResponse(200, { received: true });
};
