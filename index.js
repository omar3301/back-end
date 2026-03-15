require("dotenv").config();
const express     = require("express");
const cors        = require("cors");
const mongoose    = require("mongoose");
const path        = require("path");
const rateLimit   = require("express-rate-limit");
const helmet      = require("helmet");
const compression = require("compression");

const orderRoutes    = require("./routes/orders");
const productRoutes  = require("./routes/products");
const settingsRoutes = require("./routes/settings");

const app  = express();
const PORT = process.env.PORT || 8080;

app.use(helmet({ contentSecurityPolicy: false })); // CSP off — admin.html uses inline scripts
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET", "POST", "PATCH", "DELETE"],
  credentials: true,
}));
app.use(express.json());

// ─── RATE LIMITING ───────────────────────────────────
// General: 100 requests per minute per IP
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

// Orders: max 10 orders per 10 minutes per IP (anti-spam)
const orderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: { error: "Too many orders submitted. Please wait a few minutes." },
});

app.use(generalLimiter);
app.use("/api/orders", orderLimiter);

app.use("/api/orders",   orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/settings", settingsRoutes);

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", store: "Sola Brand & Boutique" });
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅  MongoDB connected");
    app.listen(PORT, () => {
      console.log(`✅  Server on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌  MongoDB failed:", err.message);
    process.exit(1);
  });