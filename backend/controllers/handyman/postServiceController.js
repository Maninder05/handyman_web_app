import PostService from "../../models/handyman/PostService.js";
import Order from "../../models/handyman/Orders.js";



// 📋 Get all services by handyman
export const getMyServices = async (req, res) => {
  try {
    const handymanId = req.user.id;
    const services = await PostService.find({ handymanId });
    res.status(200).json(services);
  } catch (err) {
    console.error("Error fetching services:", err);
    res.status(500).json({ message: "Error fetching services" });
  }
};

// 🧾 Get orders for handyman
export const getMyOrders = async (req, res) => {
  try {
    const handymanId = req.user.id;
    const orders = await Order.find({ handymanId })
      .populate("clientId", "name email")
      .populate("serviceId", "title price");
    res.status(200).json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ message: "Error fetching orders" });
  }
};

// 🔁 Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
    res.status(200).json(order);
  } catch (err) {
    console.error("Error updating order:", err);
    res.status(500).json({ message: "Error updating order" });
  }
};
