const express = require("express");
const router  = express.Router();
const Product = require("../models/Product");

// GET /api/products — list all products (sorted)
router.get("/", async (req, res) => {
  try {
    const products = await Product.find({ inStock: true }).sort({ sortOrder: 1, createdAt: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products." });
  }
});

// GET /api/products/all — list ALL including out of stock (admin)
router.get("/all", async (req, res) => {
  try {
    const products = await Product.find().sort({ sortOrder: 1, createdAt: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products." });
  }
});

// POST /api/products — create product
router.post("/", async (req, res) => {
  try {
    const { name, description, badge, price, tag, details, material, care, images, inStock, sortOrder } = req.body;
    if (!name || !price) return res.status(400).json({ error: "Name and price are required." });
    const product = await Product.create({ name, description, badge, price, tag, details, material, care, images: images || [], inStock: inStock !== false, sortOrder: sortOrder || 0 });
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ error: "Failed to create product." });
  }
});

// PATCH /api/products/:id — update product
router.patch("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ error: "Product not found." });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ error: "Failed to update product." });
  }
});

// DELETE /api/products/:id — delete product
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
