const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },

    customer: {
      firstName:   { type: String, required: true, trim: true },
      lastName:    { type: String, required: true, trim: true },
      // Email optional — customers may not have one
      email:       { type: String, trim: true, lowercase: true, default: "" },
      phone:       { type: String, required: true, trim: true },
      // Address fields — optional for store pickup, required for delivery (enforced in route logic)
      address:     { type: String, trim: true, default: "" },
      apartment:   { type: String, trim: true, default: "" },
      city:        { type: String, trim: true, default: "" },
      governorate: { type: String, trim: true, default: "" },
      deliveryMethod: { type: String, default: "delivery" },
    },

    items: [
      {
        productId:   mongoose.Schema.Types.Mixed,  // supports both Number and ObjectId
        name:        { type: String, required: true },
        description: { type: String, default: "" },
        badge:       { type: String, default: "" },
        price:       { type: Number, required: true },
        salePrice:   { type: Number },              // price after discount, if any
        size:        { type: String, default: "" },
        color:       { type: String, default: "" },
        image:       { type: String, default: "" },
        qty:         { type: Number, default: 1 },
      },
    ],

    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },        // total discount amount in EGP
    shipping: { type: Number, required: true },
    total:    { type: Number, required: true },

    status: {
      type: String,
      enum: ["pending", "confirmed", "out_for_delivery", "delivered", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);