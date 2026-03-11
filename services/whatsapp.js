const axios = require("axios");

async function sendWhatsApp(message) {
  const phone  = process.env.WHATSAPP_PHONE;
  const apiKey = process.env.WHATSAPP_APIKEY;

  if (!phone || !apiKey) {
    console.warn("⚠️  WhatsApp not configured — skipping notification");
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

function buildOrderMessage(order, settings) {
  const c = order.customer;

  // Arabic-safe address — just concatenate, no transforms
  const addressLine = [c.address, c.apartment, c.city, c.governorate, "Egypt"]
    .filter(Boolean)
    .join(", ");

  const itemLines = order.items
    .map((item, idx) => {
      const priceDisplay = item.salePrice
        ? `${item.salePrice.toLocaleString()} EGP (was ${item.price.toLocaleString()})`
        : `${item.price.toLocaleString()} EGP`;
      const meta = [item.size, item.color].filter(Boolean).join(" / ");
      return `${idx + 1}. ${item.name}${meta ? ` [${meta}]` : ""} — ${priceDisplay}`;
    })
    .join("\n");

  const freeThreshold = settings?.freeShippingThreshold ?? 1500;
  const deliveryLine  = order.shipping === 0
    ? `Free (order over ${freeThreshold.toLocaleString()} EGP)`
    : `${order.shipping} EGP`;

  const lines = [
    "━━━━━━━━━━━━━━━━━━━━━",
    "🛍️ NEW ORDER — SOLA",
    "━━━━━━━━━━━━━━━━━━━━━",
    "",
    `📋 Order: ${order.orderNumber}`,
    `🕐 Time: ${new Date(order.createdAt).toLocaleString("en-EG", { timeZone: "Africa/Cairo" })}`,
    "",
    "👤 CUSTOMER",
    `Name:  ${c.firstName} ${c.lastName}`,
    `Phone: ${c.phone}`,
  ];

  if (c.email) lines.push(`Email: ${c.email}`);

  lines.push(
    "",
    "📍 DELIVERY",
    addressLine,
    "",
    "📦 ITEMS",
    itemLines,
    "",
    "💰 PAYMENT (Cash on Delivery)",
    `Subtotal: ${order.subtotal.toLocaleString()} EGP`,
  );

  if (order.discount > 0)
    lines.push(`Discount: -${order.discount.toLocaleString()} EGP`);

  lines.push(
    `Delivery: ${deliveryLine}`,
    `TOTAL:    ${order.total.toLocaleString()} EGP`,
    "",
    "━━━━━━━━━━━━━━━━━━━━━"
  );

  if (settings?.whatsappNote) {
    lines.push("", `📝 ${settings.whatsappNote}`);
  }

  return lines.join("\n");
}

module.exports = { sendWhatsApp, buildOrderMessage };