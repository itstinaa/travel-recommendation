import mongoose from "mongoose";
import dotenv from "dotenv";
import Destination from "./src/models/Destination.js";

dotenv.config();

try {
  await mongoose.connect(process.env.MONGO_URI);

  await Destination.deleteMany();

  await Destination.insertMany([
    {
      name: "Bali",
      country: "Indonesia",
      region: "asia",
      vibe: "beach",
      budget: "low",
      climateType: "tropical",
      tripTypes: ["solo", "couple", "friends"],
      activityLevel: "moderate",
      avgDailyCost: 40,
      popularity: 95,
      featured: true,
      tags: ["surf", "spa", "nature", "temples", "beach", "relaxation"],
      categories: ["relaxation", "adventure", "nature"],
      description: "Tropical paradise with beaches and culture"
    },
    {
      name: "Paris",
      country: "France",
      region: "europe",
      vibe: "city",
      budget: "high",
      climateType: "temperate",
      tripTypes: ["couple", "friends", "solo"],
      avgDailyCost: 120,
      popularity: 98,
      featured: true,
      tags: ["romance", "art", "food", "culture", "city"],
      categories: ["cultural", "luxury", "city"],
      description: "Famous for romance, art, fashion, and food"
    },
    {
      name: "Tokyo",
      country: "Japan",
      region: "asia",
      vibe: "city",
      budget: "high",
      climateType: "temperate",
      tripTypes: ["solo", "friends"],
      avgDailyCost: 110,
      popularity: 97,
      featured: true,
      tags: ["technology", "food", "anime", "culture", "city"],
      categories: ["city", "cultural", "food"],
      description: "A fast-paced city blending modern life and tradition"
    },
    {
      name: "New York",
      country: "USA",
      region: "americas",
      vibe: "city",
      budget: "high",
      climateType: "cold",
      tripTypes: ["friends", "solo", "family"],
      avgDailyCost: 130,
      popularity: 96,
      featured: true,
      tags: ["shopping", "nightlife", "food", "city"],
      categories: ["city", "food"],
      description: "A world-famous urban destination with food, shopping, and nightlife"
    },
    {
      name: "Rome",
      country: "Italy",
      region: "europe",
      vibe: "cultural",
      budget: "mid",
      climateType: "temperate",
      tripTypes: ["couple", "family", "solo"],
      avgDailyCost: 80,
      popularity: 94,
      featured: true,
      tags: ["history", "food", "architecture", "culture"],
      categories: ["cultural", "city", "food"],
      description: "Historic city known for architecture, food, and ancient landmarks"
    },
    {
      name: "Barcelona",
      country: "Spain",
      region: "europe",
      vibe: "beach",
      budget: "mid",
      climateType: "sunny",
      tripTypes: ["friends", "couple"],
      avgDailyCost: 70,
      popularity: 92,
      featured: true,
      tags: ["beach", "food", "nightlife", "city"],
      categories: ["city", "beach", "food"],
      description: "A lively destination mixing beaches, food, and nightlife"
    },
    {
      name: "Dubai",
      country: "UAE",
      region: "asia",
      vibe: "luxury",
      budget: "high",
      climateType: "hot",
      tripTypes: ["family", "couple"],
      avgDailyCost: 150,
      popularity: 90,
      featured: true,
      tags: ["shopping", "desert", "luxury", "city"],
      categories: ["luxury", "city"],
      description: "Known for luxury shopping, skyscrapers, and desert experiences"
    },
    {
      name: "Bangkok",
      country: "Thailand",
      region: "asia",
      vibe: "city",
      budget: "low",
      climateType: "tropical",
      tripTypes: ["solo", "friends"],
      avgDailyCost: 35,
      popularity: 93,
      featured: true,
      tags: ["food", "nightlife", "temples", "city"],
      categories: ["city", "food", "cultural"],
      description: "A budget-friendly city with street food, temples, and nightlife"
    },
    {
      name: "Iceland",
      country: "Iceland",
      region: "europe",
      vibe: "nature",
      budget: "high",
      climateType: "cold",
      tripTypes: ["couple", "friends"],
      avgDailyCost: 140,
      popularity: 88,
      featured: true,
      tags: ["nature", "northern lights", "adventure", "scenery"],
      categories: ["nature", "adventure"],
      description: "Ideal for scenic landscapes, nature, and outdoor adventure"
    },
    {
      name: "Cape Town",
      country: "South Africa",
      region: "africa",
      vibe: "nature",
      budget: "mid",
      climateType: "sunny",
      tripTypes: ["friends", "couple"],
      avgDailyCost: 65,
      popularity: 89,
      featured: true,
      tags: ["beach", "mountains", "wildlife", "nature"],
      categories: ["nature", "adventure", "beach"],
      description: "A scenic destination with beaches, mountains, and wildlife"
    },
    {
      name: "Sydney",
      country: "Australia",
      region: "oceania",
      vibe: "beach",
      budget: "high",
      climateType: "sunny",
      tripTypes: ["friends", "family", "solo"],
      avgDailyCost: 120,
      popularity: 91,
      featured: true,
      tags: ["beach", "city", "surf", "food"],
      categories: ["beach", "city"],
      description: "A coastal city famous for beaches, surfing, and landmarks"
    },
    {
      name: "Amsterdam",
      country: "Netherlands",
      region: "europe",
      vibe: "city",
      budget: "mid",
      climateType: "temperate",
      tripTypes: ["friends", "couple", "solo"],
      avgDailyCost: 85,
      popularity: 90,
      featured: true,
      tags: ["canals", "culture", "cycling", "city"],
      categories: ["cultural", "city"],
      description: "A charming city known for canals, cycling, and culture"
    },
    {
      name: "Swiss Alps",
      country: "Switzerland",
      region: "europe",
      vibe: "nature",
      budget: "high",
      climateType: "cold",
      tripTypes: ["family", "couple", "friends"],
      avgDailyCost: 150,
      popularity: 87,
      featured: true,
      tags: ["skiing", "mountains", "snow", "nature"],
      categories: ["adventure", "nature"],
      description: "Perfect for mountain views, skiing, and winter escapes"
    },
    {
      name: "Mexico City",
      country: "Mexico",
      region: "americas",
      vibe: "cultural",
      budget: "low",
      climateType: "temperate",
      tripTypes: ["friends", "solo"],
      avgDailyCost: 45,
      popularity: 86,
      featured: false,
      tags: ["food", "history", "culture", "city"],
      categories: ["cultural", "food", "city"],
      description: "A vibrant city full of history, food, and culture"
    },
    {
      name: "Santorini",
      country: "Greece",
      region: "europe",
      vibe: "romantic",
      budget: "high",
      climateType: "sunny",
      tripTypes: ["couple"],
      avgDailyCost: 130,
      popularity: 93,
      featured: true,
      tags: ["romance", "sunset", "luxury", "island", "beach"],
      categories: ["beach", "luxury", "relaxation"],
      description: "A romantic island destination with sunsets and sea views"
    }
  ]);

  console.log("Database seeded with destinations!");
} catch (err) {
  console.error("Seed failed:", err);
} finally {
  await mongoose.disconnect();
  process.exit();
}