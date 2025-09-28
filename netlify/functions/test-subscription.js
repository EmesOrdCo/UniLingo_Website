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
    const { planType, userId, email } = JSON.parse(event.body);
    
    // Validate required fields
    if (!planType || !userId || !email) {
      return createErrorResponse(400, 'Missing required fields: planType, userId, and email are required');
    }

    // Validate plan type
    if (!['monthly', 'yearly'].includes(planType)) {
      return createErrorResponse(400, 'Invalid plan type. Must be "monthly" or "yearly"');
    }

    console.log(`Creating test subscription for user ${userId}, plan: ${planType}`);

    // Calculate next billing date
    const nextBillingDate = new Date();
    if (planType === 'monthly') {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    } else {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    }

    // Update user with test subscription data
    const { error: updateError } = await supabase
      .from('users')
      .update({
        has_active_subscription: true,
        payment_tier: planType,
        next_billing_date: nextBillingDate.toISOString(),
        stripe_customer_id: `test_customer_${userId}_${Date.now()}` // Test customer ID
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to update user with test subscription:', updateError);
      return createErrorResponse(500, 'Failed to create test subscription');
    }

    console.log(`Test subscription created successfully for user ${userId}`);

    // Return success response with subscription details
    return createResponse(200, {
      success: true,
      message: `Test ${planType} subscription activated successfully`,
      subscription: {
        hasSubscription: true,
        status: 'active',
        plan: planType === 'monthly' ? 'Monthly' : 'Yearly',
        amount: planType === 'monthly' ? '£9.99' : '£89.99',
        nextBilling: nextBillingDate.toISOString(),
        customerId: `test_customer_${userId}_${Date.now()}`,
        subscriptionId: `test_sub_${userId}_${Date.now()}`,
        isTest: true
      }
    });
    
  } catch (error) {
    console.error('Error creating test subscription:', error);
    return createErrorResponse(500, error.message);
  }
};
