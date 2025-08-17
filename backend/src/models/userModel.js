const mongoose = require("mongoose");

const SavedItineraryItemSchema = new mongoose.Schema(
  {
    name: String,
    lat: Number,
    lng: Number,
    type: String,
    province: String,
  },
  {_id: false}
);

const SavedItinerarySchema = new mongoose.Schema(
  {
    title: {type: String, required: true},
    items: [SavedItineraryItemSchema],
    total_distance_km: Number,
    createdAt: {type: Date, default: Date.now},
  },
  {_id: false}
);

const LastRecommendationsSchema = new mongoose.Schema(
  {
    generated_at: {type: Date, default: Date.now},
    input: {
      age_group: String,
      gender: String,
      travel_companion: String,
      preferred_activities: [String],
      top_n: Number,
    },
    results: {type: Array, default: []},
  },
  {_id: false}
);

const UserSchema = new mongoose.Schema(
  {
    name: {type: String, required: true, trim: true},
    email: {type: String, required: true, unique: true, lowercase: true, trim: true},
    password_hash: {type: String, required: true},
    role: {type: String, enum: ["user", "admin"], default: "user"},

    age_group: {type: String, default: null},
    gender: {type: String, default: null},
    country: {type: String, default: null},
    travel_companion: {type: String, default: null},
    preferred_activities: {type: [String], default: []},

    travel_style: {type: String, default: null},
    budget: {type: String, default: null},

    onboarding_completed: {type: Boolean, default: false},

    plan_pool: {type: [String], default: []},
    saved_itineraries: {type: [SavedItinerarySchema], default: []},
    last_recommendations: {type: LastRecommendationsSchema, default: null},

    lastLoginAt: {type: Date, default: null},
  },
  {timestamps: true}
);

module.exports = mongoose.model("User", UserSchema);
