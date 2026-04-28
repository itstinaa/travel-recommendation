import express from "express";
import auth from "../middleware/auth.js";
import adminOnly from "../middleware/admin.js";

import User from "../models/User.js";
import Favourite from "../models/Favourite.js";
import History from "../models/History.js";
import Destination from "../models/Destination.js";

const router = express.Router();

// Admin dashboard data
router.get("/dashboard", auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find()
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    const favourites = await Favourite.find()
      .populate("userId", "email role preferences createdAt")
      .populate("destinationId")
      .sort({ createdAt: -1 });

    const history = await History.find()
      .populate("userId", "email role preferences createdAt")
      .sort({ createdAt: -1 });

    const destinations = await Destination.find()
      .sort({ createdAt: -1 });

    return res.json({
      users,
      favourites,
      history,
      destinations
    });
  } catch (err) {
    console.error("ADMIN DASHBOARD ERROR:", err);
    return res.status(500).json({ error: "Failed to load admin dashboard data" });
  }
});

// Get all users
router.get("/users", auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find()
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    return res.json(users);
  } catch (err) {
    return res.status(500).json({ error: "Failed to load users" });
  }
});

// Get single user
router.get("/users/:id", auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: "Failed to load user" });
  }
});

// Update user
router.put("/users/:id", auth, adminOnly, async (req, res) => {
  try {
    const { email, role, preferences } = req.body;

    const updateData = {};

    if (email) {
      updateData.email = email.toLowerCase().trim();
    }

    if (role && ["user", "admin"].includes(role)) {
      updateData.role = role;
    }

    if (preferences) {
      updateData.preferences = {
        budget: preferences.budget || "mid",
        interests: Array.isArray(preferences.interests) ? preferences.interests : [],
        climate: preferences.climate || "",
        vibe: preferences.vibe || "",
        tripType: preferences.tripType || "",
        region: preferences.region || ""
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-passwordHash");

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      message: "User updated successfully",
      user: updatedUser
    });
  } catch (err) {
    console.error("ADMIN UPDATE USER ERROR:", err);
    return res.status(500).json({ error: "Failed to update user" });
  }
});

// Get user's favourites
router.get("/users/:id/favourites", auth, adminOnly, async (req, res) => {
  try {
    const favs = await Favourite.find({ userId: req.params.id })
      .populate("destinationId")
      .sort({ createdAt: -1 });

    return res.json(favs);
  } catch (err) {
    return res.status(500).json({ error: "Failed to load user favourites" });
  }
});

// Delete user
router.delete("/users/:id", auth, adminOnly, async (req, res) => {
  try {
    if (String(req.user.id) === String(req.params.id)) {
      return res.status(400).json({
        error: "You cannot delete your own admin account."
      });
    }

    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    await Favourite.deleteMany({ userId: req.params.id });
    await History.deleteMany({ userId: req.params.id });

    return res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("ADMIN DELETE USER ERROR:", err);
    return res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;