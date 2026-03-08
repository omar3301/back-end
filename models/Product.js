const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    badge:       { type: String, trim: true, default: "" },
    price:       { type: Number, required: true },
    tag:         { type: String, trim: true, default: "" },
    details:     { type: String, trim: true, default: "" },
    material:    { type: String, trim: true, default: "" },
    care:        { type: String, trim: true, default: "" },
    images:      [{ type: String, trim: true }],
    inStock:     { type: Boolean, default: true },
    sortOrder:   { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
