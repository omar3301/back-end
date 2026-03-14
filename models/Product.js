const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    slug:        { type: String, trim: true, lowercase: true, default: "" },
    description: { type: String, trim: true, default: "" },
    badge:       { type: String, trim: true, default: "" },
    category: {
      type: String,
      enum: ["shirts", "tshirts", "coats", "pants", "shoes", "other"],
      default: "other",
    },
    price:    { type: Number, required: true },
    tag:      { type: String, trim: true, default: "" },
    details:  { type: String, trim: true, default: "" },
    material: { type: String, trim: true, default: "" },
    care:     { type: String, trim: true, default: "" },
    images:   [{ type: String }],
    sizes:    [{ type: String }],
    colors:   [{ name: { type: String }, hex: { type: String } }],
    discount: {
      enabled: { type: Boolean, default: false },
      type:    { type: String, enum: ["percent", "fixed"], default: "percent" },
      value:   { type: Number, default: 0 },
    },
    stockQty:  { type: Number, default: null },   // null = unlimited
    inStock:   { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ slug: 1 }, { unique: true, sparse: true });
productSchema.index({ inStock: 1, sortOrder: 1, createdAt: 1 });
productSchema.index({ category: 1, inStock: 1 });

module.exports = mongoose.model("Product", productSchema);