const router = require("express").Router();
const auth = require("../middlewares/auth");
const User = require("../models/User");
const http = require("../utils/httpClient");

function mapMlLocation(r) {
  return {
    location_id: r.location_id,
    name: r.Location_Name,
    province: r.province || "",
    city: r.located_city || "",
    lat: r.lat,
    lng: r.lng,
    avg_rating: r.avg_rating,
    rating_count: r.rating_count,
    description: r.description || "",
    activities: Array.isArray(r.activities) ? r.activities : [],
    final_score: r.Final_Score,
  };
}

router.post("/from-profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    const { age_group, gender, travel_companion, preferred_activities } = user;
    if (
      !age_group ||
      !gender ||
      !travel_companion ||
      !Array.isArray(preferred_activities) ||
      preferred_activities.length < 2
    ) {
      return res.status(400).json({
        error:
          "Please complete your preferences (age_group, gender, travel_companion, preferred_activities[>=2])",
      });
    }

    const top_n = Number(
      (req.body && req.body.top_n) || req.query.top_n || 10
    );

    const input = {
      age_group,
      gender,
      travel_companion,
      preferred_activities,
      top_n,
    };

    const r = await http.post("/", input);
    const ml = r?.data || {};
    const weights = ml?.weights || null;
    const mlResults = Array.isArray(ml?.results) ? ml.results : [];

    const normalized = mlResults.map(mapMlLocation);

    await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          last_recommendations: {
            generated_at: new Date(),
            input,
            weights,               // store cbf/cf/ml weights
            results: normalized,   // normalized copy
          },
          recommended_locations: normalized, // “like plan_pool”
        },
      },
      { new: false }
    );

    // return what the UI expects (keep original ML field names)
    return res.status(200).json({
      status: ml.status || "ok",
      weights,
      results: mlResults,
      saved: true,
    });
  } catch (err) {
    console.error("from-profile error:", err?.response?.data || err.message);
    return res.status(502).json({ error: "Recommendation service unavailable" });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const { age_group, gender, travel_companion, preferred_activities, top_n = 10 } = req.body || {};
    if (
      !age_group ||
      !gender ||
      !travel_companion ||
      !Array.isArray(preferred_activities) ||
      preferred_activities.length < 2
    ) {
      return res.status(400).json({
        error: "Body must have age_group, gender, travel_companion, preferred_activities[>=2]",
      });
    }
    const payload = {
      age_group: String(age_group).trim(),
      gender: String(gender).trim(),
      travel_companion: String(travel_companion).trim(),
      preferred_activities: preferred_activities.map((s) => String(s).trim()),
      top_n: Number(top_n),
    };
    const r = await http.post("/", payload);
    return res.status(r.status).json(r.data);
  } catch (err) {
    console.error("what-if error:", err?.response?.data || err.message);
    return res.status(502).json({ error: "Recommendation service unavailable" });
  }
});

router.get('/healthz', (_req,res)=>res.json({status:'ok'}));

module.exports = router;
