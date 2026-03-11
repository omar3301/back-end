const express = require("express");
const router  = express.Router();
const Product = require("../models/Product");

// GET /api/products — public: in-stock products sorted
router.get("/", async (req, res) => {
  try {
    const products = await Product
      .find({ inStock: true })
      .sort({ sortOrder: 1, createdAt: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products." });
  }
});

// GET /api/products/all — admin: all products incl. out-of-stock
router.get("/all", async (req, res) => {
  try {
    const products = await Product
      .find()
      .sort({ sortOrder: 1, createdAt: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products." });
  }
});

// GET /api/products/:id — single product
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found." });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product." });
  }
});

// POST /api/products — create product
router.post("/", async (req, res) => {
  try {
    const {
      name, description, badge, category, price, tag,
      details, material, care, images,
      sizes, colors, discount,
      inStock, sortOrder,
    } = req.body;

    if (!name || price === undefined || price === null)
      return res.status(400).json({ error: "Name and price are required." });

    const product = await Product.create({
      name, description, badge, category,
      price: Number(price), tag, details, material, care,
      images:  Array.isArray(images)  ? images  : [],
      sizes:   Array.isArray(sizes)   ? sizes   : [],
      colors:  Array.isArray(colors)  ? colors  : [],
      discount: {
        enabled: discount?.enabled ?? false,
        type:    discount?.type    ?? "percent",
        value:   Number(discount?.value ?? 0),
      },
      inStock:   inStock !== false,
      sortOrder: Number(sortOrder) || 0,
    });

    res.status(201).json({ success: true, product });
  } catch (err) {
    console.error("Create product error:", err);
    res.status(500).json({ error: "Failed to create product." });
  }
});

// PATCH /api/products/:id — update product (partial)
router.patch("/:id", async (req, res) => {
  try {
    const update = { ...req.body };

    // Coerce numeric fields
    if (update.price     !== undefined) update.price     = Number(update.price);
    if (update.sortOrder !== undefined) update.sortOrder = Number(update.sortOrder);
    if (update.discount?.value !== undefined)
      update["discount.value"] = Number(update.discount.value);

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    );
    if (!product) return res.status(404).json({ error: "Product not found." });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ error: "Failed to update product." });
  }
});

// DELETE /api/products/:id
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found." });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete product." });
  }
});

module.exports = router;