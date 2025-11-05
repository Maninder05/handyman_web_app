import express from "express";
import { verifyToken } from "../middleware/authService.js";

// 🧰 Controllers
import {
  createService,
  getMyServices,
} from "../controllers/handyman/postServiceController.js";

import {
  createOrder,
  getHandymanOrders,
  getClientOrders,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/handyman/orderController.js";

const router = express.Router();

/* ------------------------------------------------------------------
 🧱 SERVICE ROUTES  (For Handymen to manage their own services)
-------------------------------------------------------------------*/
router.post("/services", verifyToken, createService);   // ➕ Create a service
router.get("/services", verifyToken, getMyServices);    // 📋 Get all services for handyman

/* ------------------------------------------------------------------
 🧾 ORDER ROUTES (For Clients & Handymen to manage job orders)
-------------------------------------------------------------------*/

// 🧍 Client creates new order for a handyman service
router.post("/orders", verifyToken, createOrder);

// 🧑‍🔧 Handyman views all their assigned orders
router.get("/orders/handyman", verifyToken, getHandymanOrders);

// 👤 Client views all orders they placed
router.get("/orders/client", verifyToken, getClientOrders);

// 🔄 Handyman updates status (accepted, in-progress, completed, declined)
router.put("/orders/:id/status", verifyToken, updateOrderStatus);

// ❌ Delete/cancel order
router.delete("/orders/:id", verifyToken, deleteOrder);

export default router;
