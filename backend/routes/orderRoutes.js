import express from "express";
import {
  createOrder,
  getHandymanOrders,
  getClientOrders,
  updateOrderStatus,
  deleteOrder
} from "../controllers/handyman/ordersController.js";
import authSession from "../middleware/authSession.js";

const router = express.Router();

// Create a new order (client action)
router.post("/", authSession, createOrder);

// Get handyman orders
router.get("/handyman", authSession, getHandymanOrders);

// Get client orders
router.get("/client", authSession, getClientOrders);

// Update order status (handyman can accept/decline, etc.)
router.patch("/:id", authSession, updateOrderStatus);

// Delete an order
router.delete("/:id", authSession, deleteOrder);

export default router;

