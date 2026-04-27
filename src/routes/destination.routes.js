const express = require("express");
const Destination = require("../models/Destination");

const router = express.Router();

router.get("/", async (req, res) => {
  const items = await Destination.find().limit(100);
  res.json(items);
});

// Simple seed endpoint (optional for uni demo; remove in final if you want)
router.post("/seed", async (req, res) => {
  const seed = req.body.destinations;
  if (!Array.isArray(seed) || seed.length === 0) {
    return res.status(400).json({ error: "Provide destinations array" });
  }
  await Destination.deleteMany({});
  const inserted = await Destination.insertMany(seed);
  res.json({ inserted: inserted.length });
});

module.exports = router;
