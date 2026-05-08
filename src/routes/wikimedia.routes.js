import express from "express";
import Destination from "../models/Destination.js";
import { getWikipediaSummary } from "../services/wikimedia.service.js";

const router = express.Router();

router.get("/test", async (req, res) => {
  try {
    const summary = await getWikipediaSummary({
      name: "London",
      city: "London",
      country: "United Kingdom"
    });

    res.json({
      success: true,
      message: "Wikimedia API is working",
      summary
    });
  } catch (err) {
    console.error("WIKIMEDIA TEST ERROR:", err);

    res.status(500).json({
      success: false,
      error: err.message || "Wikimedia API test failed"
    });
  }
});

router.get("/destination/:id", async (req, res) => {
  try {
    const destination = await Destination.findById(req.params.id);

    if (!destination) {
      return res.status(404).json({
        error: "Destination not found"
      });
    }

    const summary = await getWikipediaSummary(destination);

    res.json({
      destination: {
        id: destination._id,
        name: destination.name,
        city: destination.city || "",
        country: destination.country
      },
      summary
    });
  } catch (err) {
    console.error("WIKIMEDIA DESTINATION ERROR:", err);

    res.status(500).json({
      error: err.message || "Failed to load destination information"
    });
  }
});

export default router;