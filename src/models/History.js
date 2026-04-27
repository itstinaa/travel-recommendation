import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    query: {
      budget: String,
      interests: [String],
      climate: String,
      vibe: String,
      tripType: String,
      region: String
    }
  },
  { timestamps: true }
);

const History = mongoose.model("History", historySchema);
export default History;
