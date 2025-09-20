const { stripe, supabase, handleCORS, createResponse, createErrorResponse } = require('./utils');

exports.handler = async (event) => {
  // Handle CORS
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  try {
    const { priceId, planType, userId, email, successUrl, cancelUrl } = JSON.parse(event.body);
    
    // Validate required fields
    if (!priceId || !planType || !userId || !email) {
      return createErrorResponse(400, 'Missing required fields: priceId, planType, userId, and email are required');
    }

    // Check if this is a temporary user (starts with 'temp_')
    const isTempUser = userId.startsWith('temp_');
    
    let userData = null;
    if (!isTempUser) {
      // Verify user exists in database for real users
      const { data, error } = await supabase
        .from('users')
        .select('id, email')
        .eq('id', userId)
        .eq('email', email)
        .single();

      if (error || !data) {
        console.error('User verification failed:', error);
        return createErrorResponse(400, 'Invalid user credentials');
      }
      userData = data;
    } else {
      // For temp users, create mock user data
      userData = { id: userId, email: email };
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
      return createErrorResponse(500, 'Failed to create customer account');
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

    return createResponse(200, { id: session.id });
    
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return createErrorResponse(500, error.message);
  }
};
