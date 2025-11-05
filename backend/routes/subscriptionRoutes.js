// routes/subscriptionRoutes.js

import express from 'express';
import { 
    createCheckoutSession,
    createInlineSubscription,
    confirmPayPalSubscription // <-- NEW FUNCTION IMPORTED
} from '../controllers/mutual/subscriptionController.js'; 
import { handleStripeWebhook } from '../controllers/mutual/webhookController.js'; 

const router = express.Router();

// Placeholder for your authentication middleware
const protect = (req, res, next) => {
    // Mock user for local testing
    if (!req.user) {
        req.user = { id: '69066447d6d52ec0acbb35a1', email: 'random@acces.memoy' }; 
    }
    next();
};

// 1. Stripe Checkout (Redirect Flow)
router.post('/subscribe', protect, createCheckoutSession);

// 2. Stripe Elements (Inline Card Flow)
router.post('/subscribe-inline', protect, createInlineSubscription);

// 3. ✅ NEW ROUTE FOR PAYPAL CONFIRMATION
router.post('/subscribe-paypal', protect, confirmPayPalSubscription); 

// 4. Stripe Webhook
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

export default router;