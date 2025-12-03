import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price: { type: Number, default: 0 }
}, { _id: true });

const OrderSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  status: { type: String, default: 'pending' }, // pending|accepted|in-progress|completed|declined
  clientName: { type: String, default: '' },
  date: { type: Date, default: null }
}, { _id: true });

const CertificationSchema = new mongoose.Schema({
  fileName: String,
  fileUrl: String,
  uploadedAt: { type: Date, default: Date.now }
}, { _id: true });

const HandymanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    userType: {
      type: String,
      enum: ['handyman', 'client', 'admin'],
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

  handymanId: {
    type: String,
    unique: true,
    required: true,
    default: () => `HM${Date.now()}${Math.floor(Math.random() * 1000)}`
  },

  name: {
    type: String,
    required: true,
    trim: true,
    default: 'Unnamed Handyman'
  },

  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },

  userType: {
    type: String,
    enum: ['handyman', 'customer', 'admin'],
    default: 'handyman',
    required: true
  },

  contact: { type: String, trim: true, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  bio: { type: String, default: '', maxlength: 1000 },

  // images
  profilePic: { type: String, default: '' },
  profileImage: { type: String, default: '' },

  additionalLinks: {
    website: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' }
  },

  // arrays used by frontend
  skills: { type: [String], default: [] },
  services: { type: [ServiceSchema], default: [] },
  recentOrders: { type: [OrderSchema], default: [] },
  certifications: { type: [CertificationSchema], default: [] },

  // numeric counters used by frontend
  jobsDone: { type: Number, default: 0 },
  jobsDoneCount: { type: Number, default: 0 }, 
  jobsInProgressCount: { type: Number, default: 0 },
  activeOrdersCount: { type: Number, default: 0 },
  activeOrderCount: { type: Number, default: 0 },

  // other stats
  rating: { type: Number, default: 0 }, // average rating
  earnings: { type: Number, default: 0 },
  jobAcceptCount: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },
  notificationsCount: { type: Number, default: 0 },

  planType: { type: String, enum: ['Basic', 'Standard', 'Premium'], default: 'Basic' },
  verified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
},
{
  timestamps: true,
  collection: 'handymanprofiles'
});

// indexes
HandymanSchema.index({ handymanId: 1 }, { unique: true });
HandymanSchema.index({ userId: 1 });

export default mongoose.model('HandymanProfile', HandymanSchema);
