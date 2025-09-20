const { stripe, handleCORS, createResponse, createErrorResponse } = require('./utils');

exports.handler = async (event) => {
  // Handle CORS
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  try {
    const { customerId, returnUrl } = JSON.parse(event.body);
    
    if (!customerId) {
      return createErrorResponse(400, 'Customer ID is required');
    }
    
    // Create a portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${process.env.FRONTEND_URL || 'https://unilingo.co.uk'}/manage-account.html`,
    });
    
    return createResponse(200, { 
      success: true, 
      url: portalSession.url 
    });
    
  } catch (error) {
    console.error('Error creating portal session:', error);
    return createErrorResponse(500, error.message);
  }
};
