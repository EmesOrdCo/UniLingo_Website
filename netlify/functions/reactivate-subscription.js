const { stripe, supabase, handleCORS, createResponse, createErrorResponse } = require('./utils');

exports.handler = async (event) => {
  // Handle CORS
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  // Check if Supabase is initialized
  if (!supabase) {
    return createErrorResponse(500, 'Database connection not configured');
  }

  try {
    const { subscriptionId, customerId } = JSON.parse(event.body);

    if (!subscriptionId || !customerId) {
      return createErrorResponse(400, 'Missing required parameters: subscriptionId and customerId');
    }

    // Reactivate the subscription in Stripe
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false
    });

    // Update the user's subscription status in the database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (userError) {
      console.error('Error fetching user from database:', userError);
      return createErrorResponse(404, 'User not found');
    }

    // Update the user's subscription status
    const { error: updateError } = await supabase
      .from('users')
      .update({
        has_active_subscription: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userData.id);

    if (updateError) {
      console.error('Error updating user subscription status:', updateError);
      return createErrorResponse(500, 'Failed to update subscription status');
    }

    return createResponse(200, {
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_end: subscription.current_period_end
      }
    });

  } catch (error) {
    console.error('Error reactivating subscription:', error);
    return createErrorResponse(500, error.message);
  }
};
