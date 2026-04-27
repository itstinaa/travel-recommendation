import express from "express";
import mongoose from "mongoose";
import auth from "../middleware/auth.js";
import Favourite from "../models/Favourite.js";
import Destination from "../models/Destination.js";

const router = express.Router();

// Save favourite
router.post("/", auth, async (req, res) => {
  try {
    const { destinationId } = req.body;

    if (!destinationId) {
      return res.status(400).json({ error: "destinationId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(destinationId)) {
      return res.status(400).json({ error: "Invalid destinationId" });
    }

    const destinationExists = await Destination.findById(destinationId);
    if (!destinationExists) {
      return res.status(404).json({ error: "Destination not found" });
    }

    const fav = await Favourite.create({
      userId: req.user.id,
      destinationId
    });

    return res.status(201).json({
      message: "Saved to favourites",
      favourite: fav
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Already in favourites" });
    }

    console.error("SAVE FAV ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Get current user's favourites
router.get("/", auth, async (req, res) => {
  try {
    const favs = await Favourite.find({ userId: req.user.id })
      .populate("destinationId")
      .sort({ createdAt: -1 });

    return res.json(favs);
  } catch (err) {
    console.error("GET FAV ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Remove favourite
router.delete("/:id", auth, async (req, res) => {
  try {
    const deleted = await Favourite.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!deleted) {
      return res.status(404).json({ error: "Favourite not found" });
    }

    return res.json({ message: "Favourite removed" });
  } catch (err) {
    console.error("DELETE FAV ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;