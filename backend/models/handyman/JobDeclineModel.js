import mongoose from "mongoose";
const { Schema } = mongoose;

const JobDeclineSchema = new Schema(
  {
    bookingId: { type: String, required: true, index: true },
    declinedBy: { type: String, enum: ["handyman", "client"], required: true },
    reason: { type: String, required: true },

    userId: { type: Schema.Types.ObjectId, ref: "User", required: true } // the one who declined
  },
  { timestamps: true }
);

export default mongoose.model("JobDecline", JobDeclineSchema);
