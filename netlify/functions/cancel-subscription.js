const { stripe, supabase, handleCORS, createResponse, createErrorResponse } = require('./utils');

exports.handler = async (event) => {
  // Handle CORS
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  try {
    const { subscriptionId, customerId } = JSON.parse(event.body);
    
    if (!subscriptionId) {
      return createErrorResponse(400, 'Subscription ID is required');
    }
    
    // Cancel the subscription
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });

    // Update the user's subscription status in the database
    if (customerId) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (!userError && userData) {
        // Update the user's subscription status
        await supabase
          .from('users')
          .update({
            has_active_subscription: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', userData.id);
      }
    }
    
    return createResponse(200, { 
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
    return createErrorResponse(500, error.message);
  }
};
