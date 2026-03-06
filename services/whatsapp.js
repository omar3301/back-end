const axios = require("axios");

async function sendWhatsApp(message) {
  const phone  = process.env.WHATSAPP_PHONE;
  const apiKey = process.env.WHATSAPP_APIKEY;

  if (!phone || !apiKey) {
    console.warn("⚠️  WhatsApp not configured");
    return;
  }

  try {
    const encoded = encodeURIComponent(message);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encoded}&apikey=${apiKey}`;
    await axios.get(url, { timeout: 8000 });
    console.log("✅  WhatsApp notification sent");
  } catch (err) {
    console.error("❌  WhatsApp notification failed:", err.message);
  }
}

function buildOrderMessage(order) {
  const c = order.customer;

  const addressLine = [c.address, c.apartment, c.city, c.governorate, "Egypt"]
    .filter(Boolean)
    .join(", ");

  const itemLines = order.items
    .map((i, idx) => `${idx + 1}. ${i.name} (${i.badge}) — ${i.price.toLocaleString()} EGP`)
    .join("\n");

  const deliveryLine = order.shipping === 0
    ? "Free (over 1,000 EGP)"
    : `${order.shipping} EGP`;

  return [
    "━━━━━━━━━━━━━━━━━━━━━",
    "🛍️ NEW ORDER — SOLA",
    "━━━━━━━━━━━━━━━━━━━━━",
    "",
    `📋 Order No: ${order.orderNumber}`,
    `🕐 Time: ${new Date(order.createdAt).toLocaleString("en-EG", { timeZone: "Africa/Cairo" })}`,
    "",
    "👤 CUSTOMER",
    `Name:  ${c.firstName} ${c.lastName}`,
    `Phone: ${c.phone}`,
    `Email: ${c.email}`,
    "",
    "📍 DELIVERY ADDRESS",
    addressLine,
    "",
    "📦 ITEMS ORDERED",
    itemLines,
    "",
    "💰 PAYMENT (Cash on Delivery)",
    `Subtotal: ${order.subtotal.toLocaleString()} EGP`,
    `Delivery: ${deliveryLine}`,
    `TOTAL:    ${order.total.toLocaleString()} EGP`,
    "",
    "━━━━━━━━━━━━━━━━━━━━━",
  ].join("\n");
}

module.exports = { sendWhatsApp, buildOrderMessage };