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

    // CRITICAL: Never process payments with temp data
    if (userId.startsWith('temp_') || email.includes('temp@unilingo.com')) {
      console.error('CRITICAL: Attempted to process payment with temp data:', { userId, email });
      return createErrorResponse(400, 'Payment cannot be processed with temporary credentials. Please complete the process through the UniLingo app.');
    }

    // Skip user verification for now (user exists in database)
    let userData = { id: userId, email: email };
    
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
    
    // Create checkout session with trial period for yearly plan
    const sessionConfig = {
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
      }
    };

    // Add 7-day free trial for yearly plan only
    if (planType === 'yearly') {
      sessionConfig.subscription_data = {
        trial_period_days: 7,
        metadata: {
          planType: planType,
          userId: userId,
          email: email,
          customerId: customer.id,
          isTrial: 'true'
        }
      };
      
      // Add trial end date to metadata for tracking
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7);
      sessionConfig.metadata.trialEndDate = trialEndDate.toISOString();
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return createResponse(200, { id: session.id });
    
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return createErrorResponse(500, error.message);
  }
};
