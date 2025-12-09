import { stripe } from '../../services/stripeService.js';
import User from '../../models/auth/User.js';
import HandymanSubscription from '../../models/mutual/HandymanSubscriptionModel.js';

const calculateNewBillingWindow = (planType, previousPeriodEndTimestamp) => {
    let newStartDate = new Date(previousPeriodEndTimestamp);
    let newEndDate;
    
    if (planType.toLowerCase() === 'basic') {
        newStartDate.setDate(1); 
        newStartDate.setMonth(newStartDate.getMonth() + 1);
        
        newEndDate = new Date(newStartDate);
        newEndDate.setMonth(newEndDate.getMonth() + 1);
        newEndDate.setDate(0); 
    } else {
        newEndDate = new Date(newStartDate);
        newEndDate.setDate(newEndDate.getDate() + 30);
    }
    return { startDate: newStartDate, endDate: newEndDate };
};

export const handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.log(`⚠️ Webhook signature verification failed: ${err.message}`);
        return res.sendStatus(400); 
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const subscription = await stripe.subscriptions.retrieve(session.subscription);
                const handymanId = session.metadata.handymanId; 
                const planName = subscription.items.data[0].price.product.name;
                const periodEndTimestamp = subscription.current_period_end * 1000;
                const newWindow = calculateNewBillingWindow(planName, periodEndTimestamp);

                // Map plan names to job limits
                const planNameLower = planName.toLowerCase();
                let jobAcceptedLimit = 7; // Default to Basic
                if (planNameLower === 'premium') {
                    jobAcceptedLimit = 30;
                } else if (planNameLower === 'standard') {
                    jobAcceptedLimit = 15;
                } else if (planNameLower === 'basic') {
                    jobAcceptedLimit = 7;
                }

                await HandymanSubscription.findOneAndUpdate(
                    { handyman: handymanId },
                    {
                        handyman: handymanId,
                        stripeCustomerId: subscription.customer,
                        stripeSubscriptionId: subscription.id,
                        planType: planNameLower,
                        status: subscription.status,
                        startDate: newWindow.startDate,
                        endDate: newWindow.endDate,
                        isProfileVisible: true,
                        jobAcceptedLimit: jobAcceptedLimit 
                    },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
                break;
            }

            case 'invoice.paid': {
                const subscriptionId = event.data.object.subscription;
                if (subscriptionId) {
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                    const planName = subscription.items.data[0].price.product.name;
                    const periodEndTimestamp = subscription.current_period_end * 1000;
                    const newWindow = calculateNewBillingWindow(planName, periodEndTimestamp);
                    
                    await HandymanSubscription.findOneAndUpdate(
                        { stripeSubscriptionId: subscriptionId },
                        { 
                            status: 'active',
                            jobAcceptedCount: 0, // 🚨 The crucial quota reset
                            startDate: newWindow.startDate,
                            endDate: newWindow.endDate,
                            isProfileVisible: true
                        }
                    );
                }
                break;
            }
            
            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                await HandymanSubscription.findOneAndUpdate(
                    { stripeSubscriptionId: subscription.id },
                    { status: subscription.status, isProfileVisible: false }
                );
                break;
            }

            default:
        }
    } catch (error) {
        console.error("Webhook processing error:", error);
    }

    res.sendStatus(200);
};