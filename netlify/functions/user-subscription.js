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
    // Extract userId from path - Netlify Functions use different path structure
    let userId;
    if (event.pathParameters && event.pathParameters.userId) {
      userId = event.pathParameters.userId;
    } else if (event.queryStringParameters && event.queryStringParameters.userId) {
      userId = event.queryStringParameters.userId;
    } else {
      // Try to extract from the path directly
      const pathMatch = event.path.match(/\/user-subscription\/([^\/\?]+)/);
      userId = pathMatch ? pathMatch[1] : null;
    }
    
    if (!userId) {
      return createErrorResponse(400, 'User ID is required');
    }
    
    // Get user data from Supabase users table
    console.log('Supabase URL:', process.env.SUPABASE_URL);
    console.log('Service Role Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log('Service Role Key length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length);
    console.log('Service Role Key start:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20));
    
    // Try to query all users first to see if RLS is blocking
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id')
      .limit(5);
    
    console.log('All users query result:', { allUsers, allUsersError });
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, created_at, stripe_customer_id, has_active_subscription, payment_tier, next_billing_date, subscription_status')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('Error fetching user from database:', userError);
      return createErrorResponse(404, 'User not found in users table. User may need to complete signup process.');
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
    
    // Check if user has subscription in database
    if (userData.has_active_subscription === true) {
      // Determine plan and amount based on payment_tier
      let plan = 'Unknown';
      let amount = 'Unknown';
      
      if (userData.payment_tier === 'monthly') {
        plan = 'Monthly';
        amount = '£9.99';
      } else if (userData.payment_tier === 'yearly') {
        plan = 'Yearly';
        amount = '£99.99';
      } else if (userData.payment_tier) {
        plan = userData.payment_tier;
        amount = 'Unknown';
      }
      
      // Format next billing date if it exists
      let nextBilling = null;
      if (userData.next_billing_date) {
        try {
          nextBilling = new Date(userData.next_billing_date).toISOString();
        } catch (e) {
          console.error('Error parsing next_billing_date:', e);
          nextBilling = null;
        }
      }
      
      // Determine subscription status
      let status = 'active';
      let trialEndDate = null;
      
      // Check if user is in trial period
      if (userData.subscription_status === 'trialing') {
        status = 'trialing';
        // Get trial end date from Stripe if available
        trialEndDate = null;
      } else if (userData.subscription_status) {
        status = userData.subscription_status;
      }
      
      subscriptionData = {
        hasSubscription: true,
        status: status,
        plan: plan,
        amount: amount,
        nextBilling: nextBilling,
        customerId: stripeCustomerId || null,
        subscriptionId: null,
        trialEndDate: trialEndDate,
        isTrial: status === 'trialing'
      };
    }
    
    // If user has Stripe customer ID, try to get additional Stripe data
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
          
          // Determine if this is a trial subscription
          const isTrial = subscription.status === 'trialing';
          const trialEndDate = isTrial && subscription.trial_end ? 
            new Date(subscription.trial_end * 1000).toISOString() : null;
          
          subscriptionData = {
            hasSubscription: true,
            status: subscription.status,
            plan: price.nickname || (price.unit_amount === 999 ? 'Monthly' : 'Yearly'),
            amount: `£${(price.unit_amount / 100).toFixed(2)}`,
            nextBilling: new Date(subscription.current_period_end * 1000).toISOString(),
            customerId: stripeCustomerId,
            subscriptionId: subscription.id,
            trialEndDate: trialEndDate,
            isTrial: isTrial
          };
        }
      } catch (stripeError) {
        console.error('Error fetching Stripe data:', stripeError);
        // Keep the database subscription data
      }
    }
    
    // Return combined user and subscription data
    return createResponse(200, {
      user: {
        id: userData.id || null,
        email: userData.email || null,
        memberSince: userData.created_at || null
      },
      subscription: subscriptionData
    });
    
  } catch (error) {
    console.error('Error fetching subscription data:', error);
    return createErrorResponse(500, error.message);
  }
};
