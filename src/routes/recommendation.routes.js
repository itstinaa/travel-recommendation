import express from "express";
import auth from "../middleware/auth.js";
import Destination from "../models/Destination.js";
import History from "../models/History.js";
import User from "../models/User.js";
import Favourite from "../models/Favourite.js";

const router = express.Router();

function normalizeArray(arr = []) {
  return arr.map(item => String(item).trim().toLowerCase()).filter(Boolean);
}

function buildPreferenceProfile(historyItems, favouriteDestinations) {
  const profile = {
    favouriteVibes: [],
    favouriteTags: [],
    favouriteBudgets: [],
    favouriteRegions: []
  };

  const vibeCount = {};
  const tagCount = {};
  const budgetCount = {};
  const regionCount = {};

  // Favourites = strongest signal
  for (const fav of favouriteDestinations) {
    const d = fav.destinationId;
    if (!d) continue;

    if (d.vibe) {
      const vibe = d.vibe.toLowerCase();
      vibeCount[vibe] = (vibeCount[vibe] || 0) + 3;
    }

    if (d.budget) {
      const budget = d.budget.toLowerCase();
      budgetCount[budget] = (budgetCount[budget] || 0) + 3;
    }

    if (d.region) {
      const region = d.region.toLowerCase();
      regionCount[region] = (regionCount[region] || 0) + 3;
    }

    for (const tag of d.tags || []) {
      const t = String(tag).toLowerCase();
      tagCount[t] = (tagCount[t] || 0) + 3;
    }
  }

  // History = recent searches stronger than older searches
  historyItems.forEach((h, index) => {
    const weight = index < 5 ? 2 : 1;
    const q = h.query || {};

    for (const interest of q.interests || []) {
      const t = String(interest).toLowerCase();
      tagCount[t] = (tagCount[t] || 0) + weight;
    }

    if (q.region) {
      const region = String(q.region).toLowerCase();
      regionCount[region] = (regionCount[region] || 0) + weight;
    }

    if (q.vibe) {
      const vibe = String(q.vibe).toLowerCase();
      vibeCount[vibe] = (vibeCount[vibe] || 0) + weight;
    }

    if (q.budget) {
      const budget = String(q.budget).toLowerCase();
      budgetCount[budget] = (budgetCount[budget] || 0) + weight;
    }
  });

  profile.favouriteVibes = Object.entries(vibeCount)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key)
    .slice(0, 3);

  profile.favouriteBudgets = Object.entries(budgetCount)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key)
    .slice(0, 2);

  profile.favouriteTags = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key)
    .slice(0, 5);

  profile.favouriteRegions = Object.entries(regionCount)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key)
    .slice(0, 2);

  return profile;
}

function scoreDestination(dest, prefs, profile) {
  let score = 0;
  const reasons = [];

  const interests = normalizeArray(prefs.interests);
  const tags = normalizeArray(dest.tags);
  const categories = normalizeArray(dest.categories);
  const tripTypes = normalizeArray(dest.tripTypes);

  if (prefs.budget && dest.budget?.toLowerCase() === prefs.budget.toLowerCase()) {
    score += 4;
    reasons.push("matches your budget");
  }

  if (prefs.vibe && dest.vibe?.toLowerCase() === prefs.vibe.toLowerCase()) {
    score += 4;
    reasons.push("matches your preferred vibe");
  }

  if (prefs.climate && dest.climateType?.toLowerCase() === prefs.climate.toLowerCase()) {
    score += 3;
    reasons.push("matches your preferred climate");
  }

  if (prefs.tripType && tripTypes.includes(prefs.tripType.toLowerCase())) {
    score += 3;
    reasons.push("fits your trip type");
  }

  if (
    prefs.region &&
    dest.region &&
    dest.region.toLowerCase() === prefs.region.toLowerCase()
  ) {
    score += 4;
    reasons.push(`you are looking in ${dest.region}`);
  }

  const matchedInterests = interests.filter(
    interest => tags.includes(interest) || categories.includes(interest)
  );

  if (matchedInterests.length) {
    score += matchedInterests.length * 2;
    reasons.push(`matches your interests: ${matchedInterests.join(", ")}`);
  }

  if (dest.featured) {
    score += 1;
  }

  if (dest.popularity >= 85) {
    score += 1;
    reasons.push("is a popular choice with travelers");
  }

  if (profile.favouriteVibes.includes(dest.vibe?.toLowerCase())) {
    score += 2;
    reasons.push("is similar to places you liked before");
  }

  const profileTagMatches = profile.favouriteTags.filter(tag => tags.includes(tag));
  if (profileTagMatches.length) {
    score += profileTagMatches.length;
    reasons.push("matches your saved favourites and past searches");
  }

  if (profile.favouriteBudgets.includes(dest.budget?.toLowerCase())) {
    score += 1;
  }

  if (profile.favouriteRegions.includes(dest.region?.toLowerCase())) {
    score += 2;
    reasons.push("is in a region you often explore");
  }

  return { score, reasons };
}

function buildWhyText(dest, prefs, profile, reasons) {
  if (
    prefs.region &&
    dest.region?.toLowerCase() === prefs.region.toLowerCase() &&
    dest.vibe
  ) {
    return `Because you are looking in ${dest.region} and like ${dest.vibe} destinations.`;
  }

  if (
    prefs.vibe &&
    dest.vibe?.toLowerCase() === prefs.vibe.toLowerCase() &&
    profile.favouriteRegions.includes(dest.region?.toLowerCase())
  ) {
    return `Because you like ${dest.vibe} destinations and often explore ${dest.region}.`;
  }

  if (reasons.length > 0) {
    return `Because ${reasons[0].charAt(0).toLowerCase()}${reasons[0].slice(1)}.`;
  }

  return "Because it matches your saved and searched interests.";
}

router.post("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { budget, interests, climate, vibe, tripType, region } = req.body;

    const prefs = {
      budget: budget || user.preferences?.budget || "mid",
      interests: Array.isArray(interests)
        ? interests
        : user.preferences?.interests || [],
      climate: climate || user.preferences?.climate || "",
      vibe: vibe || user.preferences?.vibe || "",
      tripType: tripType || user.preferences?.tripType || "",
      region: region || user.preferences?.region || ""
    };

    await History.create({
      userId: req.user.id,
      query: prefs
    });

    await User.findByIdAndUpdate(req.user.id, {
      preferences: prefs
    });

    const [allDestinations, historyItems, favouriteDestinations] = await Promise.all([
      Destination.find(),
      History.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(20),
      Favourite.find({ userId: req.user.id }).populate("destinationId")
    ]);

    const profile = buildPreferenceProfile(historyItems, favouriteDestinations);

    const favouriteIds = new Set(
      favouriteDestinations
        .map(f => f.destinationId?._id?.toString())
        .filter(Boolean)
    );

    const ranked = allDestinations
      .map(d => {
        const { score, reasons } = scoreDestination(d, prefs, profile);
        return {
          ...d.toObject(),
          score,
          reasons,
          why: buildWhyText(d, prefs, profile, reasons)
        };
      })
      .sort((a, b) => b.score - a.score);

    const seen = new Set();

    let results = ranked.filter(d => {
      const id = d._id?.toString();
      const key = `${d.name}-${d.country}`.toLowerCase();

      if (id && favouriteIds.has(id)) return false;
      if (seen.has(key)) return false;
      if (d.score < 2) return false;

      seen.add(key);
      return true;
    });

    if (results.length < 5) {
      const fallbackSeen = new Set();

      results = ranked.filter(d => {
        const id = d._id?.toString();
        const key = `${d.name}-${d.country}`.toLowerCase();

        if (id && favouriteIds.has(id)) return false;
        if (fallbackSeen.has(key)) return false;

        fallbackSeen.add(key);
        return true;
      });
    }

    return res.json({
      prefs,
      profile,
      results: results.slice(0, 10)
    });
  } catch (err) {
    console.error("RECOMMENDATION ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;