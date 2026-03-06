const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    // Auto-generated readable order number e.g. SB-A3F9K2
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },

    // Customer contact + delivery
    customer: {
      firstName:   { type: String, required: true, trim: true },
      lastName:    { type: String, required: true, trim: true },
      email:       { type: String, required: true, trim: true, lowercase: true },
      phone:       { type: String, required: true, trim: true },
      address:     { type: String, required: true, trim: true },
      apartment:   { type: String, trim: true, default: "" },
      city:        { type: String, required: true, trim: true },
      governorate: { type: String, required: true, trim: true },
    },

    // Items purchased
    items: [
      {
        productId:   { type: Number, required: true },
        name:        { type: String, required: true },
        description: { type: String },
        badge:       { type: String },
        price:       { type: Number, required: true },
        image:       { type: String },
      },
    ],

    // Pricing
    subtotal: { type: Number, required: true },
    shipping: { type: Number, required: true },
    total:    { type: Number, required: true },

    // Order lifecycle
    status: {
      type: String,
      enum: ["pending", "confirmed", "out_for_delivery", "delivered", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

module.exports = mongoose.model("Order", orderSchema);