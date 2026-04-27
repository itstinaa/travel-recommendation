import express from "express";
import auth from "../middleware/auth.js";
import User from "../models/User.js";
import Favourite from "../models/Favourite.js";
import Destination from "../models/Destination.js";
import History from "../models/History.js";

const router = express.Router();

router.get("/profile", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("-passwordHash");
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json(user);
});

router.get("/recommended", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) return res.status(404).json({ error: "User not found" });

    const favourites = await Favourite.find({ userId: req.user.id }).populate("destinationId");
    const history = await History.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(10);

    const favouriteVibes = favourites
      .map(f => f.destinationId?.vibe)
      .filter(Boolean);

    const favouriteTags = favourites
      .flatMap(f => f.destinationId?.tags || []);

    const recentInterests = history
      .flatMap(h => h.query?.interests || []);

    const vibeSet = new Set(favouriteVibes.map(v => v.toLowerCase()));
    const interestSet = new Set([...favouriteTags, ...recentInterests].map(i => String(i).toLowerCase()));

    const all = await Destination.find();

    const ranked = all.map(d => {
      let score = 0;
      const reasons = [];

      if (vibeSet.has((d.vibe || "").toLowerCase())) {
        score += 3;
        reasons.push("Based on your favourites");
      }

      const matched = (d.tags || []).filter(tag => interestSet.has(tag.toLowerCase()));
      if (matched.length) {
        score += matched.length * 2;
        reasons.push(`Based on your interests: ${matched.join(", ")}`);
      }

      if (user.preferences?.budget === d.budget) {
        score += 2;
      }

      return {
        ...d.toObject(),
        score,
        reasons
      };
    })
    .filter(d => d.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

    return res.json(ranked);
  } catch (err) {
    console.error("RECOMMENDED ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;