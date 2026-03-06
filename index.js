require("dotenv").config();
const express   = require("express");
const cors      = require("cors");
const mongoose  = require("mongoose");
const path      = require("path");

const orderRoutes = require("./routes/orders");

const app  = express();
const PORT = process.env.PORT || 8080;

app.use(cors({
  origin: process.env.FRONTEND_URL || "https://cute-brigadeiros-2520a2.netlify.app",
  methods: ["GET", "POST", "PATCH", "DELETE"],
  credentials: true,
}));
app.use(express.json());

// ── API routes ───────────────────────────────────────
app.use("/api/orders", orderRoutes);

// ── Admin dashboard ──────────────────────────────────
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

// ── Health check ─────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", store: "Sola Brand & Boutique" });
});

// ── Connect MongoDB then start ────────────────────────
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅  MongoDB connected");
    app.listen(PORT, () => {
      console.log(`✅  Server running on http://localhost:${PORT}`);
      console.log(`    Admin:  http://localhost:${PORT}/admin`);
      console.log(`    Orders: http://localhost:${PORT}/api/orders`);
    });
  })
  .catch((err) => {
    console.error("❌  MongoDB connection failed:", err.message);
    process.exit(1);
  });