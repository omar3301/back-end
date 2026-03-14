const express = require("express");
const router  = express.Router();
const Product = require("../models/Product");

// ─── SLUG HELPER ─────────────────────────────────────
function toSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")   // remove special chars
    .replace(/[\s_]+/g, "-")    // spaces/underscores → hyphens
    .replace(/-+/g, "-")        // collapse multiple hyphens
    .replace(/^-|-$/g, "");     // strip leading/trailing hyphens
}

async function uniqueSlug(name, excludeId = null) {
  const base = toSlug(name);
  let slug = base;
  let n = 2;
  while (true) {
    const query = { slug };
    if (excludeId) query._id = { $ne: excludeId };
    const exists = await Product.findOne(query).select("_id").lean();
    if (!exists) return slug;
    slug = `${base}-${n++}`;
  }
}

// GET /api/products  — public: in-stock products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find({ inStock: true }).sort({ sortOrder: 1, createdAt: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products." });
  }
});

// GET /api/products/all  — admin: every product
router.get("/all", async (req, res) => {
  try {
    const products = await Product.find().sort({ sortOrder: 1, createdAt: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products." });
  }
});

// GET /api/products/slug/:slug  — fetch by slug (public)
router.get("/slug/:slug", async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) return res.status(404).json({ error: "Product not found." });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product." });
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found." });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product." });
  }
});

// POST /api/products  — create
router.post("/", async (req, res) => {
  try {
    const {
      name, description, badge, category, price, tag,
      details, material, care, images,
      sizes, colors, discount, stockQty,
      inStock, sortOrder,
    } = req.body;

    if (!name || price === undefined || price === null)
      return res.status(400).json({ error: "Name and price are required." });

    const slug = await uniqueSlug(name);
    const product = await Product.create({
      name, slug, description, badge,
      category: category || "other",
      price: Number(price), tag, details, material, care,
      images:  Array.isArray(images)  ? images  : [],
      sizes:   Array.isArray(sizes)   ? sizes   : [],
      colors:  Array.isArray(colors)  ? colors  : [],
      discount: {
        enabled: discount?.enabled ?? false,
        type:    discount?.type    ?? "percent",
        value:   Number(discount?.value ?? 0),
      },
      stockQty:  stockQty !== undefined && stockQty !== "" ? Number(stockQty) : null,
      inStock:   inStock !== false,
      sortOrder: Number(sortOrder) || 0,
    });

    res.status(201).json({ success: true, product });
  } catch (err) {
    console.error("Create product error:", err);
    res.status(500).json({ error: "Failed to create product." });
  }
});

// PATCH /api/products/:id  — update (partial)
router.patch("/:id", async (req, res) => {
  try {
    // Build a clean update — avoid passing undefined values to Mongo
    const body = req.body;
    const update = {};

    const simpleFields = [
      "name","description","badge","category","tag",
      "details","material","care","images","sizes","colors",
      "inStock","sortOrder","discount"
    ];
    for (const f of simpleFields) {
      if (body[f] !== undefined) update[f] = body[f];
    }
    // Regenerate slug if name changed
    if (body.name !== undefined) {
      update.slug = await uniqueSlug(body.name, req.params.id);
    }
    if (body.price     !== undefined) update.price     = Number(body.price);
    if (body.sortOrder !== undefined) update.sortOrder = Number(body.sortOrder);
    if (body.stockQty  !== undefined) {
      update.stockQty = body.stockQty !== "" && body.stockQty !== null
        ? Number(body.stockQty)
        : null;
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ error: "Product not found." });
    res.json({ success: true, product });
  } catch (err) {
    console.error("Update product error:", err);
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