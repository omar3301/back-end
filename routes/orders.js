const express  = require("express");
const router   = express.Router();
const Order    = require("../models/Order");
const Settings = require("../models/Settings");
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

// POST /api/orders  — place new order
router.post("/", async (req, res) => {
  try {
    const { customer, items, subtotal, discount, shipping, total, deliveryMethod } = req.body;

    if (!customer || !items || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: "Missing required order fields." });

    // For pickup, address fields are optional
    const isPickup = deliveryMethod === "pickup" || customer.deliveryMethod === "pickup";
    const required = ["firstName", "lastName", "phone"];
    if (!isPickup) required.push("address", "city", "governorate");

    for (const field of required) {
      if (!customer[field]?.trim())
        return res.status(400).json({ error: `Missing field: ${field}` });
    }

    let settings;
    try { settings = await Settings.findOne({ _singleton: "settings" }); } catch (_) {}

    const orderNumber = await getUniqueOrderNumber();
    const order = await Order.create({
      orderNumber,
      customer: { ...customer, deliveryMethod: isPickup ? "pickup" : "delivery" },
      items,
      subtotal:  subtotal  ?? 0,
      discount:  discount  ?? 0,
      shipping:  shipping  ?? 0,
      total:     total     ?? 0,
      deliveryMethod: isPickup ? "pickup" : "delivery",
      status: "pending",
    });

    console.log(`📦 New order: ${orderNumber}`);
    sendWhatsApp(buildOrderMessage(order, settings));

    res.status(201).json({ success: true, orderNumber: order.orderNumber });
  } catch (err) {
    console.error("❌ Order error:", err);
    res.status(500).json({ error: "Failed to place order. Please try again." });
  }
});

// GET /api/orders  — list all (newest first)
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders." });
  }
});

// PATCH /api/orders/:id/status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["pending", "confirmed", "out_for_delivery", "delivered", "cancelled"];
    if (!allowed.includes(status))
      return res.status(400).json({ error: "Invalid status." });

    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ error: "Order not found." });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: "Failed to update status." });
  }
});

// DELETE /api/orders/:id
router.delete("/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found." });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete order." });
  }
});

module.exports = router;