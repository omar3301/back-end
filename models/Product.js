const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    badge:       { type: String, trim: true, default: "" },  // e.g. "Shirts"
    category:    {
      type: String,
      enum: ["shirts", "tshirts", "coats", "pants", "shoes", "other"],
      default: "other",
    },
    price:     { type: Number, required: true },
    tag:       { type: String, trim: true, default: "" },    // "New", "Sale", brand name…
    details:   { type: String, trim: true, default: "" },
    material:  { type: String, trim: true, default: "" },
    care:      { type: String, trim: true, default: "" },
    images:    [{ type: String }],

    // Sizes — clothing: ["S","M","L"] / shoes: ["40","41","42"]
    sizes:  [{ type: String }],

    // Colors — [{ name: "White", hex: "#F8F6F2" }]
    colors: [
      {
        name: { type: String },
        hex:  { type: String },
      }
    ],

    // ── DISCOUNT ──────────────────────────────────────
    discount: {
      enabled: { type: Boolean, default: false },
      type:    { type: String, enum: ["percent", "fixed"], default: "percent" },
      value:   { type: Number, default: 0 },  // e.g. 20 = 20% off or 200 = 200 EGP off
    },

    inStock:   { type: Boolean, default: true },
    sortOrder: { type: Number,  default: 0 },
  },
  { timestamps: true }
);

// Virtual: calculated sale price
productSchema.virtual("salePrice").get(function () {
  if (!this.discount?.enabled || !this.discount?.value) return null;
  if (this.discount.type === "percent") {
    return Math.round(this.price * (1 - this.discount.value / 100));
  }
  return Math.max(0, this.price - this.discount.value);
});

productSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Product", productSchema);