const express  = require("express");
const router   = express.Router();
const Settings = require("../models/Settings");

async function getSettings() {
  let s = await Settings.findOne({ _singleton: "settings" });
  if (!s) s = await Settings.create({ _singleton: "settings" });
  return s;
}

router.get("/", async (req, res) => {
  try {
    const s = await getSettings();
    res.json({
      shippingCost:          s.shippingCost,
      freeShippingThreshold: s.freeShippingThreshold,
      shippingEnabled:       s.shippingEnabled,
      storeName:             s.storeName,
    });
  } catch (err) {
    res.json({ shippingCost: 60, freeShippingThreshold: 1500, shippingEnabled: true });
  }
});

router.patch("/", async (req, res) => {
  try {
    const allowed = ["shippingCost", "freeShippingThreshold", "shippingEnabled", "storeName", "whatsappNote"];
    const update  = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    const s = await Settings.findOneAndUpdate(
      { _singleton: "settings" },
      { $set: update },
      { new: true, upsert: true }
    );
    res.json({ success: true, settings: s });
  } catch (err) {
    res.status(500).json({ error: "Failed to update settings." });
  }
});

module.exports = router;