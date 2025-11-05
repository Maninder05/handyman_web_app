import mongoose from 'mongoose';
const { Schema } = mongoose;

const HandymanSubscriptionSchema = new Schema({
    handyman: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        unique: true
    },
    stripeCustomerId: { type: String, required: true, unique: true },
    stripeSubscriptionId: { type: String, required: true, unique: true },
    
    planType: { 
        type: String, 
        enum: ['basic', 'standard', 'premium'], 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['active', 'past_due', 'canceled', 'incomplete', 'trialing'],
        default: 'incomplete' 
    },
    
    startDate: { type: Date, required: true }, 
    endDate: { type: Date, required: true },
    
    isProfileVisible: { type: Boolean, default: false },

    jobAcceptedLimit: { type: Number, default: 5 },
    jobAcceptedCount: { type: Number, default: 0 },
    
}, { timestamps: true });

export default mongoose.model('HandymanSubscription', HandymanSubscriptionSchema);