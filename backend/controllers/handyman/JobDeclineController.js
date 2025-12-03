import JobDecline from "../../models/handyman/JobDeclineModel.js";

export const declineJob = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason, declinedBy } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "Reason is required" });
    }

    const declineRecord = await JobDecline.create({
      bookingId,
      reason,
      declinedBy: declinedBy || "handyman",  // default
      userId: req.user.id
    });

    return res.status(200).json({
      success: true,
      message: "Job decline recorded",
      data: declineRecord
    });
  } catch (err) {
    console.error("Decline error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
