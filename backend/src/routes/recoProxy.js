const router = require("express").Router();
const auth = require("../middlewares/authMiddleware");
const User = require("../models/userModel");
const http = require("../utils/httpClient");

/**
 * From saved profile (no body from client). JWT required.
 */
router.post("/recommendations/from-profile", auth, async (req, res) => {
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
        error: "Please complete your preferences (age_group, gender, travel_companion, preferred_activities[>=2])",
      });
    }

    const top_n = Number(req.query.top_n || 10);
    const payload = { age_group, gender, travel_companion, preferred_activities, top_n };

    const r = await http.post("/recommendations", payload);
    return res.status(r.status).json(r.data);
  } catch (err) {
    console.error("from-profile error:", err?.response?.data || err.message);
    return res.status(502).json({ error: "Recommendation service unavailable" });
  }
});

/**
 * OPTIONAL: what-if body (doesn't save to DB).
 */
router.post("/recommendations", auth, async (req, res) => {
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
    const r = await http.post("/recommendations", payload);
    return res.status(r.status).json(r.data);
  } catch (err) {
    console.error("what-if error:", err?.response?.data || err.message);
    return res.status(502).json({ error: "Recommendation service unavailable" });
  }
});

module.exports = router;
