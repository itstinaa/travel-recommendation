import express from "express";
import auth from "../middleware/auth.js";
import adminOnly from "../middleware/admin.js";

import User from "../models/User.js";
import Favourite from "../models/Favourite.js";
import History from "../models/History.js";
import Destination from "../models/Destination.js";

const router = express.Router();

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

router.delete("/users/:id", auth, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Favourite.deleteMany({ userId: req.params.id });
    await History.deleteMany({ userId: req.params.id });

    return res.json({ message: "User deleted" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;