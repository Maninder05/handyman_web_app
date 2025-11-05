import mongoose from 'mongoose';

const UserSettingSchema = new mongoose.Schema(
  {
    // User reference ( for both client and handyman)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    
    // User identification
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    
    userType: {
      type: String,
      enum: ['customer', 'handyman', 'admin'],
      required: true
    },
    
    // Display Settings
    theme: {
      type: String,
      default: 'light',
      enum: ['light', 'dark', 'auto']
    },
    
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'es', 'fr', 'de']
    },
    
    timezone: {
      type: String,
      default: 'UTC',
      enum: ['UTC', 'EST', 'CST', 'MST', 'PST']
    },
    
    // Notification Settings
    notificationsEnabled: {
      type: Boolean,
      default: true
    },
    
    notifications: {
      emailNotifications: {
        type: Boolean,
        default: true
      },
      smsNotifications: {
        type: Boolean,
        default: false
      },
      pushNotifications: {
        type: Boolean,
        default: true
      },
      jobAlerts: {
        type: Boolean,
        default: true
      },
      messageAlerts: {
        type: Boolean,
        default: true
      }
    }
  },
  { 
    timestamps: true,
    collection: 'usersettings'
  }
);

// Indexes for faster lookups
UserSettingSchema.index({ userId: 1 });
UserSettingSchema.index({ email: 1 });

// Make email lowercase before saving
UserSettingSchema.pre('save', function(next) {
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  next();
});

export default mongoose.model('UserSetting', UserSettingSchema);