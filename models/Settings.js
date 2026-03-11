const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    shippingCost:          { type: Number, default: 60 },
    freeShippingThreshold: { type: Number, default: 1500 },
    shippingEnabled:       { type: Boolean, default: true },
    storeName:             { type: String, default: "Sola Brand & Boutique" },
    whatsappNote:          { type: String, default: "" },
    _singleton:            { type: String, default: "settings", unique: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);