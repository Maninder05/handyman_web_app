// subscriptionController.js Author Navindu

import { stripe } from '../../services/stripeService.js';
import User from '../../models/auth/User.js'; // Assuming this is the correct path to your User model
import HandymanSubscription from '../../models/mutual/HandymanSubscriptionModel.js';
import mongoose from 'mongoose';

// 1. EXISTING FUNCTION: createCheckoutSession (For redirect flow)

export const createCheckoutSession = async (req, res) => {
    const { priceId } = req.body;
    const handymanId = req.user.id;
    
    try {
        //  FIX 1: Explicitly cast the string ID to an ObjectId
        const objectId = new mongoose.Types.ObjectId(handymanId);
        const handyman = await User.findById(objectId);

        if (!handyman) {
            console.error(`User not found for ID: ${handymanId}`);
            return res.status(404).json({error: 'Authenticated user record not found.'});
        }

        //  Verify user is a handyman
        if (handyman.userType !== 'handyman') {
            return res.status(403).json({ error: 'Only handymen can purchase memberships.' });
        }
        
        let customerId = handyman.stripeCustomerId;

        if (!customerId) {
            const customer = await stripe.customers.create({ email: handyman.email });
            customerId = customer.id;
            // Update MongoDB with the new Customer ID
            await User.updateOne({ _id: handymanId }, { stripeCustomerId: customerId }); 
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: customerId,
            line_items: [{ price: priceId, quantity: 1 }],
            metadata: { handymanId: handymanId.toString() }, 
            success_url: `${process.env.CLIENT_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/subscription/cancel`,
        });

        res.status(200).json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: 'Failed to initiate payment process.' });
    }
};

// Helper function to get or create Stripe price
const getOrCreatePrice = async (planName, billing) => {
    const planPrices = {
        'Basic': { monthly: 7, yearly: 70 },
        'Standard': { monthly: 10, yearly: 100 },
        'Premium': { monthly: 20, yearly: 200 }
    };

    const amount = planPrices[planName]?.[billing];
    if (!amount) {
        throw new Error(`Invalid plan: ${planName} with billing: ${billing}`);
    }

    // Convert to cents for Stripe
    const amountInCents = Math.round(amount * 100);
    const interval = billing === 'monthly' ? 'month' : 'year';
    
    // Try to find existing price first by lookup_key
    const lookupKey = `${planName.toLowerCase()}_${billing}`;
    console.log(`Looking for existing price with lookup_key: ${lookupKey}`);
    
    try {
        // First try to retrieve by lookup_key directly (more efficient)
        try {
            const prices = await stripe.prices.list({
                lookup_keys: [lookupKey],
                limit: 1
            });
            
            if (prices.data.length > 0) {
                console.log(`Found existing price: ${prices.data[0].id}`);
                return prices.data[0].id;
            }
        } catch (listError) {
            // If lookup_keys doesn't work, try searching all prices
            console.log(`lookup_keys search failed, trying alternative method...`);
            const allPrices = await stripe.prices.list({
                limit: 100
            });
            const existingPrice = allPrices.data.find(p => p.lookup_key === lookupKey);
            if (existingPrice) {
                console.log(`Found existing price via search: ${existingPrice.id}`);
                return existingPrice.id;
            }
        }
    } catch (searchError) {
        console.log(`Price search error (will create new):`, searchError.message);
    }
    
    console.log(`No existing price found, creating new price...`);

    // Create product if it doesn't exist
    const productName = `${planName} Plan`;
    console.log(`Looking for product: ${productName}`);
    
    // List products and find by name (Stripe doesn't support name filter in list)
    const products = await stripe.products.list({
        limit: 100
    });
    
    const existingProduct = products.data.find(p => p.name === productName);

    let productId;
    if (existingProduct) {
        productId = existingProduct.id;
        console.log(`Found existing product: ${productId}`);
    } else {
        console.log(`Creating new product: ${productName}`);
        const product = await stripe.products.create({
            name: productName,
            description: `Handyman ${planName} membership plan`
        });
        productId = product.id;
        console.log(`Created new product: ${productId}`);
    }

    // Create price
    console.log(`Creating new Stripe price: ${amountInCents} cents, ${interval} interval, product: ${productId}`);
    const price = await stripe.prices.create({
        product: productId,
        unit_amount: amountInCents,
        currency: 'cad',
        recurring: {
            interval: interval
        },
        lookup_key: lookupKey
    });

    console.log(`Created new price with ID: ${price.id}`);
    return price.id;
};

// 2. NEW FUNCTION: createInlineSubscription (For Stripe Elements flow)
/**
 * Creates a Stripe Subscription directly using PaymentMethod ID 
 * received from the Stripe Elements form (inline payment).
 */
export const createInlineSubscription = async (req, res) => {
    console.log('🔵 ========== createInlineSubscription CALLED ==========');
    console.log('🔵 Request body:', req.body);
    console.log('🔵 req.user:', req.user ? { id: req.user.id, email: req.user.email, userType: req.user.userType } : 'NO USER');
    
    // Accept either priceId (legacy) or planName + billing (new)
    const { priceId, paymentMethodId, planName, billing } = req.body;
    
    console.log('🔵 Received subscription request:', { priceId, paymentMethodId, planName, billing });
    
    // We get the user ID from the authentication middleware (req.user.id)
    const handymanId = req.user.id;
    console.log('🔵 handymanId from req.user.id:', handymanId); 

    if (!paymentMethodId) {
        return res.status(400).json({ error: 'Missing paymentMethodId.' });
    }

    let finalPriceId = priceId;

    // If priceId is "placeholder" or not provided, create/get price from planName and billing
    if (!finalPriceId || finalPriceId === 'placeholder') {
        if (!planName || !billing) {
            return res.status(400).json({ error: 'Missing planName and billing. Either provide priceId or planName + billing.' });
        }
        try {
            console.log(`Creating/getting price for ${planName} ${billing}...`);
            finalPriceId = await getOrCreatePrice(planName, billing);
            console.log(`Price ID obtained: ${finalPriceId}`);
        } catch (error) {
            console.error('Error in getOrCreatePrice:', error);
            return res.status(400).json({ error: error.message });
        }
    }

    try {
        // FIX 2: Explicitly cast the string ID to an ObjectId
        const objectId = new mongoose.Types.ObjectId(handymanId);
        const handyman = await User.findById(objectId);
        
        if (!handyman) {
             return res.status(404).json({ error: 'Authenticated user record not found.' });
        }

        //  Verify user is a handyman
        if (handyman.userType !== 'handyman') {
            return res.status(403).json({ error: 'Only handymen can purchase memberships.' });
        }
        
        let customerId = handyman.stripeCustomerId;

        // 1. Find or Create Stripe Customer
        if (!customerId) {
            // Case 1: NEW Customer - Stripe handles attachment and default setting automatically
            const customer = await stripe.customers.create({ 
                email: handyman.email,
                payment_method: paymentMethodId,
                invoice_settings: { default_payment_method: paymentMethodId },
            });
            customerId = customer.id;
            // Update MongoDB with the new Customer ID
            await User.updateOne({ _id: handymanId }, { stripeCustomerId: customerId }); 
        } else {
             // Case 2: EXISTING Customer 
             
             //  FIX APPLIED: Explicitly ATTACH the payment method first
             await stripe.paymentMethods.attach(
                 paymentMethodId,
                 { customer: customerId }
             );

             // Then, update the customer's settings to use the attached payment method
             await stripe.customers.update(customerId, {
                 invoice_settings: { default_payment_method: paymentMethodId },
             });
        }
        
        // 2. Create the Subscription
        console.log(`🔵 Creating subscription for customer ${customerId} with price ${finalPriceId}`);
        console.log(`🔵 handymanId: ${handymanId}, planName: ${planName}, billing: ${billing}`);
        
        const subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: finalPriceId }],
            // Ensures the subscription uses the attached card immediately
            collection_method: 'charge_automatically', 
            expand: ['latest_invoice.payment_intent'], 
        });

        console.log(`✅ Subscription created successfully: ${subscription.id}, status: ${subscription.status}`);
        console.log(`🔵 Subscription details:`, {
            current_period_end: subscription.current_period_end,
            current_period_start: subscription.current_period_start,
            status: subscription.status
        });
        console.log(`🔵 About to create HandymanSubscription record...`);

        // 3. Create/Update HandymanSubscription record
        try {
            console.log(`🔵 Starting subscription record creation for handymanId: ${handymanId} (type: ${typeof handymanId})`);
            
            // Convert handymanId to ObjectId if it's a string
            const handymanObjectId = mongoose.Types.ObjectId.isValid(handymanId) 
                ? new mongoose.Types.ObjectId(handymanId) 
                : handymanId;
            console.log(`🔵 Converted handymanId to ObjectId: ${handymanObjectId}`);
            
            // Get plan name from the price/product, with fallback to request body
            let planNameLower;
            
            if (planName) {
                // Use planName from request body if available
                planNameLower = planName.toLowerCase();
                console.log(`Using planName from request: "${planName}" -> "${planNameLower}"`);
            } else {
                // Fallback: Get plan name from Stripe product
                const price = await stripe.prices.retrieve(finalPriceId);
                const product = await stripe.products.retrieve(price.product);
                console.log(`Product name from Stripe: "${product.name}"`);
                const extractedPlanName = product.name.replace(' Plan', '').trim(); // Remove " Plan" suffix and trim
                planNameLower = extractedPlanName.toLowerCase();
                console.log(`Extracted plan name from product: "${extractedPlanName}" -> "${planNameLower}"`);
            }
            
            // Calculate billing window
            // Use current_period_start if available, otherwise use now
            const startDate = subscription.current_period_start 
                ? new Date(subscription.current_period_start * 1000)
                : new Date();
            
            // Calculate endDate - use current_period_end if valid, otherwise calculate from billing cycle
            let endDate;
            if (subscription.current_period_end && !isNaN(new Date(subscription.current_period_end * 1000).getTime())) {
                endDate = new Date(subscription.current_period_end * 1000);
                console.log(`🔵 Using subscription.current_period_end: ${endDate.toISOString()}`);
            } else {
                // Fallback: calculate based on billing cycle
                console.log(`⚠️ subscription.current_period_end missing or invalid, calculating from billing cycle`);
                endDate = new Date(startDate);
                if (billing === 'yearly') {
                    endDate.setFullYear(endDate.getFullYear() + 1);
                } else {
                    endDate.setMonth(endDate.getMonth() + 1);
                }
                console.log(`🔵 Calculated endDate from billing cycle (${billing}): ${endDate.toISOString()}`);
            }
            
            // Final validation
            if (isNaN(endDate.getTime())) {
                throw new Error(`Invalid endDate calculated: ${endDate}`);
            }
            
            console.log(`🔵 Final date range: startDate=${startDate.toISOString()}, endDate=${endDate.toISOString()}`);
            
            // Map plan names to job limits
            let jobAcceptedLimit = 7; // Default to Basic
            if (planNameLower === 'premium') {
                jobAcceptedLimit = 30;
            } else if (planNameLower === 'standard') {
                jobAcceptedLimit = 15;
            } else if (planNameLower === 'basic') {
                jobAcceptedLimit = 7;
            }
            
            console.log(`🔵 Creating subscription record with:`, {
                handyman: handymanObjectId,
                planType: planNameLower,
                status: subscription.status,
                stripeSubscriptionId: subscription.id
            });
            
            const subscriptionRecord = await HandymanSubscription.findOneAndUpdate(
                { handyman: handymanObjectId },
                {
                    handyman: handymanObjectId,
                    stripeCustomerId: customerId,
                    stripeSubscriptionId: subscription.id,
                    planType: planNameLower,
                    status: subscription.status,
                    startDate: startDate,
                    endDate: endDate,
                    isProfileVisible: true,
                    jobAcceptedLimit: jobAcceptedLimit
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            
            console.log(`HandymanSubscription record created/updated:`, {
                handymanId: handymanId,
                planType: planNameLower,
                status: subscription.status,
                subscriptionId: subscription.id,
                recordId: subscriptionRecord._id
            });
            
            // Verify the record was created
            const verifyRecord = await HandymanSubscription.findOne({ handyman: handymanId });
            if (verifyRecord) {
                console.log(`✅ Verified subscription record exists: planType=${verifyRecord.planType}, status=${verifyRecord.status}`);
            } else {
                console.error(`❌ ERROR: Subscription record was not created! handymanId=${handymanId}`);
            }
        } catch (subError) {
            console.error("❌ Error creating HandymanSubscription record:", subError);
            console.error("Error stack:", subError.stack);
            // Don't fail the request if subscription record creation fails, but log it
        }

        // 4. SUCCESS: Send back the subscription data 
        res.status(200).json({
            message: "Subscription successfully initiated.",
            subscription: {
                id: subscription.id,
                status: subscription.status,
            }
        });

    } catch (error) {
        console.error("Error creating inline subscription:", error);
        console.error("Error details:", error.message, error.stack);
        // Send the specific error message from Stripe back to the frontend
        const errorMessage = error.raw ? error.raw.message : (error.message || "Failed to process payment with provided card details.");
        res.status(500).json({ 
            error: errorMessage
        });
    }
};

// 3. NEW FUNCTION: changePlan (Update existing subscription to new plan)
/**
 * Changes an existing subscription to a new plan without requiring payment
 * Similar to Netflix's plan change functionality
 */
export const changePlan = async (req, res) => {
    const { planName, billing } = req.body;
    const handymanId = req.user.id;
    
    console.log('🔵 Plan change request:', { handymanId, planName, billing });
    
    if (!planName || !billing) {
        return res.status(400).json({ error: 'Missing planName or billing.' });
    }

    try {
        // Get handyman and their subscription
        const objectId = new mongoose.Types.ObjectId(handymanId);
        const handyman = await User.findById(objectId);
        
        if (!handyman) {
            return res.status(404).json({ error: 'User not found.' });
        }

        if (handyman.userType !== 'handyman') {
            return res.status(403).json({ error: 'Only handymen can change plans.' });
        }

        // Find existing subscription record
        const existingSubscription = await HandymanSubscription.findOne({ handyman: handymanId });
        
        if (!existingSubscription) {
            return res.status(404).json({ error: 'No active subscription found. Please purchase a plan first.' });
        }

        if (!existingSubscription.stripeSubscriptionId) {
            return res.status(400).json({ error: 'Subscription not linked to Stripe.' });
        }

        // Get or create the new price
        const planNameLower = planName.toLowerCase();
        const newPriceId = await getOrCreatePrice(planName, billing);
        console.log(`🔵 New price ID: ${newPriceId}`);

        // Retrieve current Stripe subscription
        const stripeSubscription = await stripe.subscriptions.retrieve(existingSubscription.stripeSubscriptionId);
        console.log(`🔵 Current Stripe subscription: ${stripeSubscription.id}, status: ${stripeSubscription.status}`);

        // Update the subscription to the new plan
        const updatedSubscription = await stripe.subscriptions.update(
            existingSubscription.stripeSubscriptionId,
            {
                items: [{
                    id: stripeSubscription.items.data[0].id,
                    price: newPriceId,
                }],
                proration_behavior: 'create_prorations', // Prorate the difference
            }
        );

        console.log(`✅ Subscription updated to new plan: ${updatedSubscription.id}`);
        console.log(`🔵 Subscription details:`, {
            current_period_end: updatedSubscription.current_period_end,
            current_period_start: updatedSubscription.current_period_start,
            status: updatedSubscription.status
        });

        // Calculate new billing window with validation
        const startDate = new Date();
        let endDate = new Date();
        
        // Use current_period_end from Stripe if valid
        if (updatedSubscription.current_period_end && typeof updatedSubscription.current_period_end === 'number') {
            endDate = new Date(updatedSubscription.current_period_end * 1000);
            // Validate the date
            if (isNaN(endDate.getTime())) {
                console.log('⚠️ current_period_end is invalid, calculating from billing cycle');
                endDate = new Date();
                if (billing === 'yearly') {
                    endDate.setFullYear(endDate.getFullYear() + 1);
                } else {
                    endDate.setMonth(endDate.getMonth() + 1);
                }
            }
        } else {
            // Fallback: calculate from billing cycle
            console.log('⚠️ current_period_end missing or invalid, calculating from billing cycle');
            endDate = new Date();
            if (billing === 'yearly') {
                endDate.setFullYear(endDate.getFullYear() + 1);
            } else {
                endDate.setMonth(endDate.getMonth() + 1);
            }
            console.log(`🔵 Calculated endDate from billing cycle (${billing}): ${endDate.toISOString()}`);
        }
        
        // Final validation
        if (isNaN(endDate.getTime())) {
            console.error('❌ Invalid endDate calculated, using fallback');
            endDate = new Date();
            if (billing === 'yearly') {
                endDate.setFullYear(endDate.getFullYear() + 1);
            } else {
                endDate.setMonth(endDate.getMonth() + 1);
            }
        }
        
        console.log(`🔵 Final date range: startDate=${startDate.toISOString()}, endDate=${endDate.toISOString()}`);
        
        // Map plan names to job limits
        let jobAcceptedLimit = 7;
        if (planNameLower === 'premium') {
            jobAcceptedLimit = 30;
        } else if (planNameLower === 'standard') {
            jobAcceptedLimit = 15;
        } else if (planNameLower === 'basic') {
            jobAcceptedLimit = 7;
        }

        // Update HandymanSubscription record
        await HandymanSubscription.findOneAndUpdate(
            { handyman: handymanId },
            {
                planType: planNameLower,
                status: updatedSubscription.status,
                startDate: startDate,
                endDate: endDate,
                jobAcceptedLimit: jobAcceptedLimit
            },
            { new: true }
        );

        console.log(`✅ HandymanSubscription updated: planType=${planNameLower}, status=${updatedSubscription.status}`);

        res.status(200).json({
            message: "Plan changed successfully",
            subscription: {
                id: updatedSubscription.id,
                status: updatedSubscription.status,
                planType: planNameLower
            }
        });

    } catch (error) {
        console.error("Error changing plan:", error);
        console.error("Error stack:", error.stack);
        
        // Ensure we always return JSON, not HTML
        if (!res.headersSent) {
            const errorMessage = error.raw ? error.raw.message : (error.message || "Failed to change plan.");
            res.status(500).json({ 
                error: errorMessage,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
};


// =========================================================
// 3. NEW FUNCTION: confirmPayPalSubscription (For PayPal Orders flow)
// =========================================================================
export const confirmPayPalSubscription = async (req, res) => {
    
    const { orderId, planName } = req.body;
    const handymanId = req.user.id; 

    if (!orderId) {
         return res.status(400).json({ error: 'Missing PayPal Order ID.' });
    }

    try {

        //  Verify user exists and is a handyman
        const handyman = await User.findById(handymanId);
        if (!handyman) {
            return res.status(404).json({ error: 'Authenticated user record not found.' });
        }
        if (handyman.userType !== 'handyman') {
            return res.status(403).json({ error: 'Only handymen can purchase memberships.' });
        }
        
        console.log(`Received PayPal Order ID ${orderId} for user ${handymanId} on ${planName} plan.`);

        // 🚨 Placeholder: Update user status in MongoDB here.
        // const handyman = await User.findById(handymanId);
        // if (handyman) {
        //    await User.updateOne({ _id: handymanId }, { subscriptionStatus: 'active', paymentMethod: 'PayPal', subscriptionPlan: planName });
        // }
        
        return res.status(200).json({ 
            message: "PayPal subscription process confirmed on backend.",
            orderId: orderId
        });

    } catch (error) {
        console.error("PayPal backend confirmation failed:", error);
        res.status(500).json({ error: 'Failed to process PayPal confirmation.' });
    }
};