import mongoose from "mongoose";

const postServiceSchema = new mongoose.Schema(
  {
    handymanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Handyman",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Service title is required"],
      trim: true,
      minlength: [3, "Service title must be at least 3 characters long"],
    },
    description: {
      type: String,
      required: [true, "Service description is required"],
      trim: true,
      minlength: [10, "Service description must be at least 10 characters long"],
    },
    price: {
      type: Number,
      required: [true, "Service price is required"],
      min: [1, "Price must be greater than 0"],
    },
    category: {
      type: String,
      default: "General",
      trim: true,
    },
    images: [
      {
        type: String, // Image URLs (can come from Cloudinary)
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt & updatedAt
  }
);

export default mongoose.model("PostService", postServiceSchema);
