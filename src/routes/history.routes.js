import express from "express";
import auth from "../middleware/auth.js";
import History from "../models/History.js";

const router = express.Router();

// Get history
router.get("/", auth, async (req, res) => {
  try {
    const items = await History.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.json(items);
  } catch (err) {
    console.error("GET HISTORY ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Delete one history item
router.delete("/:id", auth, async (req, res) => {
  try {
    const deleted = await History.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!deleted) {
      return res.status(404).json({ error: "History item not found" });
    }

    return res.json({ message: "History item deleted" });
  } catch (err) {
    console.error("DELETE HISTORY ITEM ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Clear all history
router.delete("/", auth, async (req, res) => {
  try {
    await History.deleteMany({ userId: req.user.id });
    return res.json({ message: "History cleared" });
  } catch (err) {
    console.error("CLEAR HISTORY ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;