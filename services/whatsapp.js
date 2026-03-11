const axios = require("axios");

async function sendWhatsApp(message) {
  const phone  = process.env.WHATSAPP_PHONE;
  const apiKey = process.env.WHATSAPP_APIKEY;
  if (!phone || !apiKey) { console.warn("⚠️  WhatsApp not configured"); return; }
  try {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;
    await axios.get(url, { timeout: 8000 });
    console.log("✅  WhatsApp sent");
  } catch (err) {
    console.error("❌  WhatsApp failed:", err.message);
  }
}

function buildOrderMessage(order, settings) {
  const c = order.customer;
  const isPickup = order.deliveryMethod === "pickup" || c.deliveryMethod === "pickup";
  const addressLine = isPickup
    ? "STORE PICKUP — Khub, Shebin El Kom, Menofia"
    : [c.address, c.apartment, c.city, c.governorate, "Egypt"].filter(Boolean).join(", ");
  const itemLines = order.items.map((item, idx) => {
    const price = item.salePrice ? `${item.salePrice.toLocaleString()} EGP (was ${item.price.toLocaleString()})` : `${item.price.toLocaleString()} EGP`;
    const meta  = [item.size, item.color].filter(Boolean).join(" / ");
    const qty   = item.qty > 1 ? ` x${item.qty}` : "";
    return `${idx+1}. ${item.name}${meta?` [${meta}]`:""}${qty} — ${price}`;
  }).join("\n");
  const freeThreshold = settings?.freeShippingThreshold ?? 1500;
  const deliveryLine  = isPickup ? "Free (Store Pickup)" : order.shipping === 0 ? `Free (over ${freeThreshold.toLocaleString()} EGP)` : `${order.shipping} EGP`;
  const lines = [
    "━━━━━━━━━━━━━━━━━━━━━",
    "NEW ORDER — SOLA",
    "━━━━━━━━━━━━━━━━━━━━━",
    "",
    `Order: ${order.orderNumber}`,
    `Time:  ${new Date(order.createdAt).toLocaleString("en-EG", { timeZone: "Africa/Cairo" })}`,
    `Type:  ${isPickup ? "Store Pickup" : "Home Delivery"}`,
    "",
    "CUSTOMER",
    `Name:  ${c.firstName} ${c.lastName}`,
    `Phone: ${c.phone}`,
  ];
  if (c.email) lines.push(`Email: ${c.email}`);
  lines.push("", "DELIVERY", addressLine, "", "ITEMS", itemLines, "", "PAYMENT (Cash on Delivery)", `Subtotal: ${order.subtotal.toLocaleString()} EGP`);
  if (order.discount > 0) lines.push(`Discount: -${order.discount.toLocaleString()} EGP`);
  lines.push(`Delivery: ${deliveryLine}`, `TOTAL:    ${order.total.toLocaleString()} EGP`, "", "━━━━━━━━━━━━━━━━━━━━━");
  if (settings?.whatsappNote) lines.push("", settings.whatsappNote);
  return lines.join("\n");
}

module.exports = { sendWhatsApp, buildOrderMessage };