const router = require("express").Router();
const auth = require("../middlewares/authMiddleware");
const User = require("../models/userModel");

router.get("/users/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id, "-password_hash").lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    const onboarding_needed = !(
      user.age_group &&
      user.gender &&
      user.travel_companion &&
      Array.isArray(user.preferred_activities) &&
      user.preferred_activities.length >= 2
    );

    return res.json({
      status: "ok",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        onboarding_completed: user.onboarding_completed || !onboarding_needed,
        onboarding_needed,

        // expose profile fields for UI
        age_group: user.age_group || null,
        gender: user.gender || null,
        country: user.country || null,
        travel_companion: user.travel_companion || null,
        preferred_activities: user.preferred_activities || [],
        travel_style: user.travel_style || null,  // new
        budget: user.budget || null,              // new

        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
    });
  } catch (err) {
    console.error("users/me error:", err);
    return res.status(500).json({ error: "Failed to fetch user" });
  }
});

module.exports = router;
