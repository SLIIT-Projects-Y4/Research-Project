const mongoose = require("mongoose");

const SavedItineraryItemSchema = new mongoose.Schema(
  {
    name: String,
    lat: Number,
    lng: Number,
    type: String,
    province: String,
  },
  { _id: false }
);

const SavedItinerarySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    items: [SavedItineraryItemSchema],
    total_distance_km: Number,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// NEW: Plan pool entry (what we save when user clicks "Add to Plan")
const PlanPoolItemSchema = new mongoose.Schema(
  {
    location_id: { type: String, required: true },
    name: { type: String, required: true },          // Location_Name
    city: { type: String, default: "" },             // located_city
    province: { type: String, default: "" },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    avg_rating: { type: Number, default: null },
    rating_count: { type: Number, default: null },
    description: { type: String, default: "" },
    activities: { type: [String], default: [] },
  },
  { _id: false }
);

const RecommendedLocationSchema = new mongoose.Schema(
  {
    location_id: String,
    name: String,
    province: String,
    city: String,
    lat: Number,
    lng: Number,
    avg_rating: Number,
    rating_count: Number,
    description: String,
    activities: [String],
    final_score: Number,
  },
  { _id: false }
);

const LastRecommendationsSchema = new mongoose.Schema(
  {
    generated_at: { type: Date, default: Date.now },
    input: {
      age_group: String,
      gender: String,
      travel_companion: String,
      preferred_activities: [String],
      top_n: Number,
    },
    weights: {
      cbf: Number,
      cf: Number,
      ml: Number,
    },
    results: { type: [RecommendedLocationSchema], default: [] },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },

    age_group: { type: String, default: null },
    gender: { type: String, default: null },
    country: { type: String, default: null },
    travel_companion: { type: String, default: null },
    preferred_activities: { type: [String], default: [] },

    travel_style: { type: String, default: null },
    budget: { type: String, default: null },

    onboarding_completed: { type: Boolean, default: false },

    // CHANGED: from [String] to array of objects with location details
    plan_pool: { type: [PlanPoolItemSchema], default: [] },

    saved_itineraries: { type: [SavedItinerarySchema], default: [] },

    last_recommendations: { type: LastRecommendationsSchema, default: null },

    // kept from your model
    recommended_locations: { type: [RecommendedLocationSchema], default: [] },

    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
