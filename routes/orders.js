const express = require("express");
const router  = express.Router();
const Order   = require("../models/Order");
const { sendWhatsApp, buildOrderMessage } = require("../services/whatsapp");

function generateOrderNumber() {
  return "SB-" + Math.random().toString(36).substr(2, 6).toUpperCase();
}

async function getUniqueOrderNumber() {
  let num, exists;
  do {
    num    = generateOrderNumber();
    exists = await Order.findOne({ orderNumber: num });
  } while (exists);
  return num;
}

// POST /api/orders — place new order
router.post("/", async (req, res) => {
  try {
    const { customer, items, subtotal, shipping, total } = req.body;

    if (!customer || !items || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: "Missing required order fields." });

    const required = ["firstName","lastName","email","phone","address","city","governorate"];
    for (const field of required) {
      if (!customer[field]?.trim())
        return res.status(400).json({ error: `Missing customer field: ${field}` });
    }

    const orderNumber = await getUniqueOrderNumber();
    const order = await Order.create({ orderNumber, customer, items, subtotal, shipping: shipping ?? 0, total, status: "pending" });

    console.log(`📦 New order saved: ${orderNumber}`);
    sendWhatsApp(buildOrderMessage(order));

    res.status(201).json({ success: true, orderNumber: order.orderNumber });
  } catch (err) {
    console.error("❌ Order error:", err);
    res.status(500).json({ error: "Failed to place order. Please try again." });
  }
});

// GET /api/orders — list all orders (newest first)
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders." });
  }
});

// PATCH /api/orders/:id/status — update order status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["pending","confirmed","out_for_delivery","delivered","cancelled"];
    if (!allowed.includes(status))
      return res.status(400).json({ error: "Invalid status value." });

    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ error: "Order not found." });

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: "Failed to update status." });
  }
});

module.exports = router;