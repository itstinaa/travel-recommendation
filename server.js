import express from "express";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import authRoutes from "./src/routes/auth.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import favouriteRoutes from "./src/routes/favourite.routes.js";
import historyRoutes from "./src/routes/history.routes.js";
import recommendationRoutes from "./src/routes/recommendation.routes.js";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static frontend
app.use(express.static(path.join(__dirname, "src/public")));

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true, message: "Server is running" });
});

// API routes
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/favourites", favouriteRoutes);
app.use("/history", historyRoutes);
app.use("/recommendations", recommendationRoutes);

// Default page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "src/public/index.html"));
});

// Mongo connection + server start
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

startServer();