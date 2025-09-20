const { stripe, supabase, handleCORS, createResponse, createErrorResponse } = require('./utils');

exports.handler = async (event) => {
  // Handle CORS
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  try {
    const userId = event.pathParameters.userId;
    
    // First, get user data from Supabase users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('Error fetching user from database:', userError);
      return createErrorResponse(404, 'User not found');
    }
    
    // Get user auth data for email and created_at
    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError) {
      console.error('Error fetching auth data:', authError);
      return createErrorResponse(404, 'User auth data not found');
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
    return createResponse(200, {
      user: {
        id: authData.user.id,
        email: authData.user.email,
        memberSince: authData.user.created_at
      },
      subscription: subscriptionData
    });
    
  } catch (error) {
    console.error('Error fetching subscription data:', error);
    return createErrorResponse(500, error.message);
  }
};
