import dotenv from "dotenv";
import mongoose from "mongoose";
import Destination from "../src/models/Destination.js";

dotenv.config();

const cityUpdates = [
  {
    matchNames: ["Thailand"],
    update: {
      name: "Bangkok",
      city: "Bangkok",
      country: "Thailand",
      region: "asia"
    }
  },
  {
    matchNames: ["Japan", "Tokyo"],
    update: {
      name: "Tokyo",
      city: "Tokyo",
      country: "Japan",
      region: "asia"
    }
  },
  {
    matchNames: ["Iceland", "Ice Land"],
    update: {
      name: "Reykjavik",
      city: "Reykjavik",
      country: "Iceland",
      region: "europe"
    }
  },
  {
    matchNames: ["Swiss Alps", "Switzerland"],
    update: {
      name: "Zurich",
      city: "Zurich",
      country: "Switzerland",
      region: "europe"
    }
  },
  {
    matchNames: ["Bali"],
    update: {
      name: "Bali",
      city: "Denpasar",
      country: "Indonesia",
      region: "asia"
    }
  },
  {
    matchNames: ["France", "Paris"],
    update: {
      name: "Paris",
      city: "Paris",
      country: "France",
      region: "europe"
    }
  },
  {
    matchNames: ["Italy", "Rome"],
    update: {
      name: "Rome",
      city: "Rome",
      country: "Italy",
      region: "europe"
    }
  },
  {
    matchNames: ["Spain", "Barcelona"],
    update: {
      name: "Barcelona",
      city: "Barcelona",
      country: "Spain",
      region: "europe"
    }
  },
  {
    matchNames: ["Netherlands", "Amsterdam"],
    update: {
      name: "Amsterdam",
      city: "Amsterdam",
      country: "Netherlands",
      region: "europe"
    }
  },
  {
    matchNames: ["Greece", "Santorini"],
    update: {
      name: "Santorini",
      city: "Santorini",
      country: "Greece",
      region: "europe"
    }
  }
];

async function updateDestinationCities() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("Missing MONGO_URI in .env");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to MongoDB");

    for (const item of cityUpdates) {
      const result = await Destination.updateMany(
        {
          $or: [
            { name: { $in: item.matchNames } },
            { country: { $in: item.matchNames } }
          ]
        },
        {
          $set: item.update
        }
      );

      console.log(
        `${item.update.name}: matched ${result.matchedCount}, updated ${result.modifiedCount}`
      );
    }

    console.log("Destination city update complete.");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Update failed:", err.message);
    process.exit(1);
  }
}

updateDestinationCities();