require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const mongoose   = require("mongoose");
const path       = require("path");
const rateLimit  = require("express-rate-limit");
const zlib       = require("zlib");
const crypto     = require("crypto");


const productRoutes  = require("./routes/products");
const settingsRoutes = require("./routes/settings");

const app  = express();
const PORT = process.env.PORT || 8080;

// ─── SECURITY HEADERS (no helmet needed) ─────────────
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options",  "nosniff");
  res.setHeader("X-Frame-Options",         "SAMEORIGIN");
  res.setHeader("X-XSS-Protection",        "1; mode=block");
  res.setHeader("Referrer-Policy",         "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy",      "geolocation=(), microphone=()");
  next();
});

// ─── GZIP COMPRESSION (no compression package needed) ─
app.use((req, res, next) => {
  const ae = req.headers["accept-encoding"] || "";
  if (!ae.includes("gzip")) return next();
  const orig = res.json.bind(res);
  res.json = (body) => {
    const buf = Buffer.from(JSON.stringify(body));
    zlib.gzip(buf, (err, compressed) => {
      if (err) return orig(body);
      res.setHeader("Content-Encoding", "gzip");
      res.setHeader("Content-Type",     "application/json");
      res.setHeader("Vary",             "Accept-Encoding");
      res.end(compressed);
    });
  };
  next();
});
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

// ─── ADMIN AUTH ───────────────────────────────────────
const adminSessions = new Set();

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body || {};
  const adminUser = process.env.ADMIN_USER || "admin";
  const adminPass = process.env.ADMIN_PASS || "sola2024";
  if (username === adminUser && password === adminPass) {
    const token = crypto.randomBytes(32).toString("hex");
    adminSessions.add(token);
    setTimeout(() => adminSessions.delete(token), 24 * 60 * 60 * 1000);
    return res.json({ success: true, token });
  }
  res.status(401).json({ error: "Invalid credentials." });
});

app.post("/api/admin/logout", (req, res) => {
  const token = req.headers["x-admin-token"];
  if (token) adminSessions.delete(token);
  res.json({ success: true });
});

app.get("/api/admin/verify", (req, res) => {
  const token = req.headers["x-admin-token"];
  res.json({ valid: adminSessions.has(token) });
});

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