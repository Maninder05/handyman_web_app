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
} from "../controllers/handyman/ordersController.js";

const router = express.Router();

/* ------------------------------------------------------------------
 🧱 SERVICE ROUTES  (For Handymen to manage their own services)
-------------------------------------------------------------------*/
router.post("/services", createService);   // ➕ Create a service
router.get("/services", getMyServices);    // 📋 Get all services for handyman

/* ------------------------------------------------------------------
 🧾 ORDER ROUTES (For Clients & Handymen to manage job orders)
-------------------------------------------------------------------*/

// 🧍 Client creates new order for a handyman service
router.post("/orders", createOrder);

// 🧑‍🔧 Handyman views all their assigned orders
router.get("/orders/handyman", getHandymanOrders);

// 👤 Client views all orders they placed
router.get("/orders/client", getClientOrders);

// 🔄 Handyman updates status (accepted, in-progress, completed, declined)
router.put("/orders/:id/status", updateOrderStatus);

// ❌ Delete/cancel order
router.delete("/orders/:id", deleteOrder);

export default router;
