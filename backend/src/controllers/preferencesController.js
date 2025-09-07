const User = require("../models/userModel");

exports.getMyPreferences = async (req, res) => {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({error: "Unauthorized"});

    try {
        const user = await User.findById(
          userId,
          "age_group gender country travel_companion preferred_activities travel_style budget onboarding_completed updatedAt"
        ).lean();

        if (!user) return res.status(404).json({error: "User not found"});

        const hasCoreFour =
          !!user.age_group &&
          !!user.gender &&
          !!user.travel_companion &&
          Array.isArray(user.preferred_activities) &&
          user.preferred_activities.length >= 2;

        return res.json({
            status: "ok",
            data: {
                age_group: user.age_group || null,
                gender: user.gender || null,
                country: user.country || null,
                travel_companion: user.travel_companion || null,
                preferred_activities: user.preferred_activities || [],
                travel_style: user.travel_style || null,
                budget: user.budget || null,
                onboarding_completed: !!user.onboarding_completed || hasCoreFour,
                updatedAt: user.updatedAt,
            },
        });
    } catch (err) {
        console.error("getMyPreferences error:", err);
        return res.status(500).json({error: "Failed to read preferences"});
    }
};

exports.updatePreferences = async (req, res) => {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({error: "Unauthorized"});

    const allowed = [
        "age_group",
        "gender",
        "country",
        "travel_companion",
        "preferred_activities",
        "travel_style",
        "budget"
    ];
    const updates = {};
    for (const k of allowed) if (k in req.body && req.body[k] !== undefined) updates[k] = req.body[k];

    // normalize shapes
    if ("preferred_activities" in updates) {
        if (!Array.isArray(updates.preferred_activities)) {
            return res.status(400).json({error: "preferred_activities must be an array of strings"});
        }
        updates.preferred_activities = updates.preferred_activities.map((s) => String(s).trim()).filter(Boolean);
    }
    if ("age_group" in updates) updates.age_group = String(updates.age_group).trim();
    if ("gender" in updates) updates.gender = String(updates.gender).trim();
    if ("country" in updates) updates.country = String(updates.country).trim();
    if ("travel_companion" in updates) updates.travel_companion = String(updates.travel_companion).trim();
    if ("travel_style" in updates) updates.travel_style = String(updates.travel_style).trim();
    if ("budget" in updates) updates.budget = String(updates.budget).trim();

    try {
        const user = await User.findByIdAndUpdate(
          userId,
          {$set: updates},
          {new: true, projection: {password_hash: 0}}
        );
        if (!user) return res.status(404).json({error: "User not found"});

        const hasCoreFour =
          user.age_group &&
          user.gender &&
          user.travel_companion &&
          Array.isArray(user.preferred_activities) &&
          user.preferred_activities.length >= 2;

        if (hasCoreFour && !user.onboarding_completed) {
            user.onboarding_completed = true;
            await user.save();
        }

        return res.status(204).send();
    } catch (err) {
        console.error("updatePreferences error:", err);
        return res.status(500).json({error: "Failed to update preferences"});
    }
};
