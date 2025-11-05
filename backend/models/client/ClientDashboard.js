import mongoose from "mongoose";

const ClientSchema = new mongoose.Schema(
  {
    // User reference 
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    
    // Unique client identifier 
    clientId: { 
      type: String, 
      unique: true, 
      required: true,
      default: () => `CL${Date.now()}${Math.floor(Math.random() * 1000)}`
    },
    
    // Basic Information
    name: { 
      type: String, 
      trim: true 
    },
    
    firstName: { 
      type: String, 
      trim: true 
    },
    
    lastName: { 
      type: String, 
      trim: true 
    },
    
    email: { 
      type: String, 
      required: true, 
      trim: true, 
      unique: true,
      lowercase: true
    },
    
    // User type 
    userType: { 
      type: String, 
      enum: ['handyman', 'customer', 'admin'], 
      default: 'customer',
      required: true
    },
    
    // Contact Information 
    contact: { 
      type: String,
      trim: true
    },
    
    phone: { 
      type: String 
    },
    
    address: { 
      type: String 
    },
    
    // Profile Details 
    bio: { 
      type: String,
      maxlength: 500
    },
    
    // Profile Picture
    profilePic: { 
      type: String,
      default: ''
    },
    
    profileImage: { 
      type: String 
    },
    
    // Additional Links 
    additionalLinks: {
      website: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' }
    },
    
    // Notifications count
    notificationsCount: { 
      type: Number, 
      default: 0 
    },
    
    // Jobs Posted Count 
    jobsPostedCount: { 
      type: Number, 
      default: 0 
    },
    
    jobsPosted: { 
      type: Number, 
      default: 0 
    },
    
    // Active Booking Count 
    activeBookings: { 
      type: Number, 
      default: 0 
    },
    
    activeJobs: { 
      type: Number, 
      default: 0 
    },
    
    totalSpent: { 
      type: Number, 
      default: 0 
    },
    
    // Saved/Favorite Handymen
    savedHandymen: { 
      type: [String], 
      default: [] 
    },
    
    // Recent Jobs
    recentBookings: [
      {
        title: String,
        description: String,
        status: String,
        budget: Number,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    
    // Account status
    isActive: { 
      type: Boolean, 
      default: true 
    }
  },
  { 
    timestamps: true
  }
);


export default mongoose.models.Client || mongoose.model("ClientProfile", ClientSchema);