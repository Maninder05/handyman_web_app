import mongoose from 'mongoose';

const HandymanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    handymanId: {
      type: String,
      unique: true,
      required: true,
      default: () => `HM${Date.now()}${Math.floor(Math.random() * 1000)}`
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    userType: {
      type: String,
      enum: ['handyman', 'customer', 'admin'],
      default: 'handyman',
      required: true
    },

    contact: {
      type: String,
      trim: true
    },

    phone: {
      type: String,
      default: ''
    },

    address: {
      type: String
    },

    bio: {
      type: String,
      default: '',
      maxlength: 500
    },

    profilePic: {
      type: String,
      default: ''
    },

    profileImage: {
      type: String,
      default: ''
    },

    additionalLinks: {
      website: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' }
    },

    skills: {
      type: [String],
      default: []
    },

    services: [
      {
        title: String,
        desc: String
      }
    ],

    certifications: [
      {
        fileName: String,
        fileUrl: String,
        uploadedAt: { type: Date, default: Date.now }
      }
    ],

    activeOrderCount: {
      type: Number,
      default: 0
    },

    jobsInProgressCount: {
      type: Number,
      default: 0
    },

    jobsDoneCount: {
      type: Number,
      default: 0
    },

    reviewsCount: {
      type: Number,
      default: 0
    },

    notificationsCount: {
      type: Number,
      default: 0
    },

    planType: {
      type: String,
      enum: ['Basic', 'Standard', 'Premium'],
      default: 'Basic'
    },

    verified: {
      type: Boolean,
      default: false
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);
// HandymanSchema.index({ email: 1 });
// HandymanSchema.index({ userId: 1 });
// HandymanSchema.index({ handymanId: 1 });

export default mongoose.model('HandymanProfile', HandymanSchema);