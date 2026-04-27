import mongoose from "mongoose";

const destinationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    country: {
      type: String,
      required: true,
      trim: true
    },

    region: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
      enum: ["", "africa", "americas", "asia", "europe", "oceania"]
    },

    city: {
      type: String,
      default: "",
      trim: true
    },

    description: {
      type: String,
      default: "",
      trim: true
    },

    imageUrl: {
      type: String,
      default: "",
      trim: true
    },

    budget: {
      type: String,
      required: true,
      default: "mid",
      lowercase: true,
      enum: ["low", "mid", "high"]
    },

    vibe: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
      enum: [
        "",
        "beach",
        "city",
        "adventure",
        "nature",
        "luxury",
        "romantic",
        "cultural",
        "relaxation",
        "food"
      ]
    },

    climateType: {
      type: String,
      default: "",
      trim: true,
      lowercase: true
    },

    tripTypes: {
      type: [String],
      default: [],
      set: (arr) =>
        Array.isArray(arr)
          ? [...new Set(arr.map(v => String(v).trim().toLowerCase()).filter(Boolean))]
          : []
    },

    tags: {
      type: [String],
      default: [],
      set: (tags) =>
        Array.isArray(tags)
          ? [...new Set(tags.map(tag => String(tag).trim().toLowerCase()).filter(Boolean))]
          : []
    },

    categories: {
      type: [String],
      default: [],
      set: (cats) =>
        Array.isArray(cats)
          ? [...new Set(cats.map(cat => String(cat).trim().toLowerCase()).filter(Boolean))]
          : []
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },

    popularity: {
      type: Number,
      default: 0,
      min: 0
    },

    featured: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

destinationSchema.index({
  name: "text",
  country: "text",
  city: "text",
  tags: "text",
  categories: "text"
});

const Destination = mongoose.model("Destination", destinationSchema);

export default Destination;