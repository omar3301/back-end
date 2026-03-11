const mongoose = require("mongoose");

// Singleton settings document — always one record in DB
const settingsSchema = new mongoose.Schema(
  {
    // ── SHIPPING ──────────────────────────────────────
    shippingCost:          { type: Number, default: 60 },
    freeShippingThreshold: { type: Number, default: 1500 },
    shippingEnabled:       { type: Boolean, default: true },  // false = always free

    // ── STORE INFO ────────────────────────────────────
    storeName:    { type: String, default: "Sola Brand & Boutique" },
    whatsappNote: { type: String, default: "" },  // extra note on WhatsApp orders msg

    // ── SINGLETON GUARD ───────────────────────────────
    _singleton: { type: String, default: "settings", unique: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);