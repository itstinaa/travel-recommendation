import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },

    passwordHash: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },

    preferences: {
      budget: {
        type: String,
        enum: ["low", "mid", "high"],
        default: "mid"
      },
      interests: {
        type: [String],
        default: []
      },
      climate: {
        type: String,
        default: ""
      },
      vibe: {
        type: String,
        default: ""
      },
      tripType: {
        type: String,
        default: ""
      },
      region: {
        type: String,
        default: ""
      }
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;