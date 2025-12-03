
import HandymanService from "../../models/handyman/Service.js"; 

export const findHandyman = async (req, res) => {
  try {
    const categoryQuery = (req.query.category || "").trim();

    if (!categoryQuery) {
      return res.status(400).json({ message: "Category is required" });
    }

    const handymen = await HandymanService.find({
      category: { $regex: new RegExp(`^${categoryQuery}$`, "i") },
    }).populate("handymanId"); // populate if needed

    res.json(handymen);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
