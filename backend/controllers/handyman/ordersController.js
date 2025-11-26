import Order from "../../models/handyman/Orders.js";
import PostService from "../../models/handyman/PostService.js";

/**
 * 🧾 Create a new order (Client requests a handyman service)
 */
export const createOrder = async (req, res) => {
  try {
    const { serviceId, handymanId, title, description, clientName } = req.body;
    const clientId = req.user.id; // from verifyToken middleware

    // Validate referenced service
    const service = await PostService.findById(serviceId);
    if (!service) return res.status(404).json({ message: "Service not found" });

    const order = new Order({
      serviceId,
      handymanId,
      clientId,
      title,
      description,
      clientName,
    });

    await order.save();
    res.status(201).json({ message: "Order created successfully", order });
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ message: "Error creating order" });
  }
};

/**
 * 📋 Get all orders for the currently logged-in handyman
 */
export const getHandymanOrders = async (req, res) => {
  try {
    const handymanId = req.user.id;
    const orders = await Order.find({ handymanId })
      .populate("clientId", "name email")
      .populate("serviceId", "title price");

    res.status(200).json(orders);
  } catch (err) {
    console.error("Error fetching handyman orders:", err);
    res.status(500).json({ message: "Error fetching handyman orders" });
  }
};

/**
 * 🧍 Get all orders placed by the logged-in client
 */
export const getClientOrders = async (req, res) => {
  try {
    const clientId = req.user.id;
    const orders = await Order.find({ clientId })
      .populate("serviceId", "title price")
      .populate("handymanId", "name email");
    res.status(200).json(orders);
  } catch (err) {
    console.error("Error fetching client orders:", err);
    res.status(500).json({ message: "Error fetching client orders" });
  }
};

/**
 * 🔄 Update an order's status (handyman action)
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "accepted",
      "in-progress",
      "completed",
      "declined",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.status(200).json({ message: "Order status updated", order });
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ message: "Error updating order status" });
  }
};

/**
 * Delete an order (admin or client cancellation)
 */
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByIdAndDelete(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error("Error deleting order:", err);
    res.status(500).json({ message: "Error deleting order" });
  }
};
// controllers/orderController.js

const Order = require("../models/Order");  // adjust path based on your structure

/**
 * @desc    Create a new order
 * @route   POST /api/orders
 * @access  Public / User
 */
exports.createOrder = async (req, res) => {
    try {
        const { userId, items, totalAmount, paymentMethod, address } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: "Order items required" });
        }

        const newOrder = await Order.create({
            userId,
            items,
            totalAmount,
            paymentMethod,
            address,
            status: "Pending",
        });

        res.status(201).json({ success: true, order: newOrder });
    } catch (error) {
        console.error("Create Order Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * @desc    Get all orders (with optional filters)
 * @route   GET /api/orders
 * @access  Admin
 */
exports.getAllOrders = async (req, res) => {
    try {
        const { userId, status, startDate, endDate } = req.query;

        let filter = {};

        if (userId) filter.userId = userId;
        if (status) filter.status = status;

        // Date filtering
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const orders = await Order.find(filter).sort({ createdAt: -1 });

        res.status(200).json({ success: true, results: orders.length, orders });
    } catch (error) {
        console.error("Get Orders Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * @desc    Get single order by ID
 * @route   GET /api/orders/:id
 * @access  Public / User
 */
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.status(200).json({ success: true, order });
    } catch (error) {
        console.error("Get Order Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * @desc    Update order status (Admin / User)
 * @route   PUT /api/orders/:id/status
 * @access  Admin / User
 */
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, message: "Status is required" });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.status(200).json({ success: true, order });
    } catch (error) {
        console.error("Status Update Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * @desc    Delete an order
 * @route   DELETE /api/orders/:id
 * @access  Admin
 */
exports.deleteOrder = async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.status(200).json({ success: true, message: "Order deleted successfully" });
    } catch (error) {
        console.error("Delete Order Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
