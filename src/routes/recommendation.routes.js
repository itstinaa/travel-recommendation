import express from "express";
import auth from "../middleware/auth.js";
import Destination from "../models/Destination.js";
import History from "../models/History.js";
import User from "../models/User.js";
import Favourite from "../models/Favourite.js";

const router = express.Router();

function clean(value = "") {
  return String(value).trim().toLowerCase();
}

function normalizeArray(arr = []) {
  return arr.map(item => clean(item)).filter(Boolean);
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

  for (const fav of favouriteDestinations) {
    const d = fav.destinationId;
    if (!d) continue;

    if (d.vibe) vibeCount[clean(d.vibe)] = (vibeCount[clean(d.vibe)] || 0) + 3;
    if (d.budget) budgetCount[clean(d.budget)] = (budgetCount[clean(d.budget)] || 0) + 3;
    if (d.region) regionCount[clean(d.region)] = (regionCount[clean(d.region)] || 0) + 3;

    for (const tag of d.tags || []) {
      const t = clean(tag);
      tagCount[t] = (tagCount[t] || 0) + 3;
    }
  }

  historyItems.forEach((h, index) => {
    const weight = index < 5 ? 2 : 1;
    const q = h.query || {};

    for (const interest of q.interests || []) {
      const t = clean(interest);
      tagCount[t] = (tagCount[t] || 0) + weight;
    }

    if (q.region) regionCount[clean(q.region)] = (regionCount[clean(q.region)] || 0) + weight;
    if (q.vibe) vibeCount[clean(q.vibe)] = (vibeCount[clean(q.vibe)] || 0) + weight;
    if (q.budget) budgetCount[clean(q.budget)] = (budgetCount[clean(q.budget)] || 0) + weight;
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

  if (prefs.budget && clean(dest.budget) === clean(prefs.budget)) {
    score += 4;
    reasons.push("matches your budget");
  }

  if (prefs.vibe && clean(dest.vibe) === clean(prefs.vibe)) {
    score += 4;
    reasons.push("matches your preferred vibe");
  }

  if (prefs.climate && clean(dest.climateType) === clean(prefs.climate)) {
    score += 3;
    reasons.push("matches your preferred climate");
  }

  if (prefs.tripType && tripTypes.includes(clean(prefs.tripType))) {
    score += 3;
    reasons.push("fits your trip type");
  }

  if (prefs.region && clean(dest.region) === clean(prefs.region)) {
    score += 5;
    reasons.push(`is in ${dest.region}`);
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
    reasons.push("is a popular choice with travellers");
  }

  if (profile.favouriteVibes.includes(clean(dest.vibe))) {
    score += 2;
    reasons.push("is similar to places you liked before");
  }

  const profileTagMatches = profile.favouriteTags.filter(tag => tags.includes(tag));

  if (profileTagMatches.length) {
    score += profileTagMatches.length;
    reasons.push("matches your saved favourites and past searches");
  }

  if (profile.favouriteBudgets.includes(clean(dest.budget))) {
    score += 1;
  }

  if (!prefs.region && profile.favouriteRegions.includes(clean(dest.region))) {
    score += 2;
    reasons.push("is in a region you often explore");
  }

  return { score, reasons };
}

function buildWhyText(dest, prefs, reasons) {
  if (prefs.region && clean(dest.region) === clean(prefs.region)) {
    return `Because you selected ${dest.region}, and this destination matches your travel preferences.`;
  }

  if (reasons.length > 0) {
    return `Because ${reasons[0].charAt(0).toLowerCase()}${reasons[0].slice(1)}.`;
  }

  return "Because it matches your saved and searched interests.";
}

router.post("/", auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);

    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const { budget, interests, climate, vibe, tripType, region } = req.body;

    const prefs = {
      budget: clean(budget),
      interests: Array.isArray(interests)
        ? interests.map(i => clean(i)).filter(Boolean)
        : [],
      climate: clean(climate),
      vibe: clean(vibe),
      tripType: clean(tripType),
      region: clean(region)
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

    const selectedRegion = clean(prefs.region);

    let availableDestinations = allDestinations;

    if (selectedRegion) {
      availableDestinations = allDestinations.filter(destination =>
        clean(destination.region) === selectedRegion
      );
    }

    const ranked = availableDestinations
      .map(destination => {
        const { score, reasons } = scoreDestination(destination, prefs, profile);

        return {
          ...destination.toObject(),
          score,
          reasons,
          why: buildWhyText(destination, prefs, reasons)
        };
      })
      .sort((a, b) => b.score - a.score);

    const seen = new Set();

    const results = ranked.filter(destination => {
      const id = destination._id?.toString();
      const key = `${destination.name}-${destination.country}`.toLowerCase();

      if (id && favouriteIds.has(id)) return false;
      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    }).slice(0, 10);

    return res.json({
      prefs,
      profile,
      selectedRegion,
      results,
      message: selectedRegion
        ? `Showing destinations in ${selectedRegion}`
        : "Showing destinations from all regions"
    });

  } catch (err) {
    console.error("RECOMMENDATION ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;