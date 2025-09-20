const { stripe, handleCORS, createResponse, createErrorResponse } = require('./utils');

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
