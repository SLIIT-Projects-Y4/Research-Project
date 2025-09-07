const router = require("express").Router();
const auth = require("../middlewares/authMiddleware");
const User = require("../models/userModel");

// ---------------- existing endpoints ----------------

router.get("/users/me", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id, "-password_hash").lean();
        if (!user) return res.status(404).json({error: "User not found"});

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
                age_group: user.age_group || null,
                gender: user.gender || null,
                country: user.country || null,
                travel_companion: user.travel_companion || null,
                preferred_activities: user.preferred_activities || [],
                travel_style: user.travel_style || null,
                budget: user.budget || null,
                lastLoginAt: user.lastLoginAt,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });
    } catch (err) {
        console.error("users/me error:", err);
        return res.status(500).json({error: "Failed to fetch user"});
    }
});

router.get("/users/me/recommendations", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id, "last_recommendations").lean();
        const lr = user?.last_recommendations || null;
        return res.json({status: "ok", data: lr});
    } catch (err) {
        console.error("users/me/recommendations error:", err);
        return res.status(500).json({error: "Failed to fetch saved recommendations"});
    }
});

router.get("/users/me/plan-pool", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id, "plan_pool").lean();
        return res.json({status: "ok", data: user?.plan_pool || []});
    } catch (err) {
        console.error("GET plan-pool error:", err);
        return res.status(500).json({error: "Failed to fetch plan pool"});
    }
});

router.post("/users/me/plan-pool", auth, async (req, res) => {
    try {
        const {
            location_id,
            name,
            city = "",
            province = "",
            lat = null,
            lng = null,
            avg_rating = null,
            rating_count = null,
            description = "",
            activities = [],
        } = req.body || {};

        if (!location_id || !name) {
            return res.status(400).json({error: "location_id and name are required"});
        }

        const exists = await User.exists({
            _id: req.user.id,
            "plan_pool.location_id": location_id,
        });
        if (exists) {
            return res.status(409).json({error: "Location is already in plan pool"});
        }

        const item = {
            location_id,
            name,
            city,
            province,
            lat,
            lng,
            avg_rating,
            rating_count,
            description,
            activities: Array.isArray(activities) ? activities : [],
        };

        await User.findByIdAndUpdate(
          req.user.id,
          {$push: {plan_pool: item}},
          {new: false}
        );

        return res.status(201).json({status: "created", data: item, message: "Added to plan pool"});
    } catch (err) {
        console.error("POST plan-pool error:", err);
        return res.status(500).json({error: "Failed to add to plan pool"});
    }
});

router.delete("/users/me/plan-pool/:location_id", auth, async (req, res) => {
    try {
        const {location_id} = req.params;
        if (!location_id) return res.status(400).json({error: "location_id is required"});

        const result = await User.findByIdAndUpdate(
          req.user.id,
          {$pull: {plan_pool: {location_id}}},
          {new: true, projection: {plan_pool: 1}}
        );

        return res.json({
            status: "ok",
            message: "Removed from plan pool",
            data: result?.plan_pool || [],
        });
    } catch (err) {
        console.error("DELETE plan-pool error:", err);
        return res.status(500).json({error: "Failed to remove from plan pool"});
    }
});

// ---------------- new endpoints: saved itineraries ----------------

/**
 * POST /api/users/me/itineraries
 * body: { title?: string, plan: { status:'ok', itinerary:[...], total_distance_km: number } }
 * Saves into user.saved_itineraries using your current schema:
 *   { title, items: [{ name, lat, lng, type, province }], total_distance_km, createdAt }
 */
router.post("/users/me/itineraries", auth, async (req, res) => {
    try {
        const { title, plan } = req.body || {};
        if (!plan || plan.status !== 'ok' || !Array.isArray(plan.itinerary)) {
            return res.status(400).json({ error: "Invalid plan payload" });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        const items = plan.itinerary.map((x) => ({
            name: x.name,
            lat: typeof x.lat === 'number' ? x.lat : null,
            lng: typeof x.lng === 'number' ? x.lng : null,
            type: x.type || null,
            province: x.province || null,
        }));

        const autoTitle = (() => {
            const s = plan?.start?.name || (items[0]?.name || "Start");
            const e = plan?.end?.name || (items[items.length - 1]?.name || "End");
            const r = plan?.corridor_radius_km ? `${plan.corridor_radius_km}km` : "";
            return r ? `${s} → ${e} (${r} corridor)` : `${s} → ${e}`;
        })();

        const doc = {
            title: title && String(title).trim().length ? String(title).trim() : autoTitle,
            items,
            total_distance_km: typeof plan.total_distance_km === 'number' ? plan.total_distance_km : null,
            createdAt: new Date(),
        };

        user.saved_itineraries.push(doc);
        await user.save();

        // return newest entry (at the end)
        const idx = user.saved_itineraries.length - 1;
        return res.status(201).json({ status: "created", index: idx, data: user.saved_itineraries[idx] });
    } catch (err) {
        console.error("POST users/me/itineraries error:", err);
        return res.status(500).json({ error: "Failed to save itinerary" });
    }
});

/**
 * GET /api/users/me/itineraries
 * Returns array (newest last since we push; we can reverse for newest first)
 */
router.get("/users/me/itineraries", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id, "saved_itineraries").lean();
        if (!user) return res.status(404).json({ error: "User not found" });

        // newest first
        const list = [...(user.saved_itineraries || [])].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        return res.json({ status: "ok", data: list });
    } catch (err) {
        console.error("GET users/me/itineraries error:", err);
        return res.status(500).json({ error: "Failed to fetch itineraries" });
    }
});

/**
 * DELETE /api/users/me/itineraries/:index
 * Because your schema uses _id:false for saved_itineraries subdocs, we delete by array index.
 * (If you prefer deleting by id, we can flip the schema to _id:true on that subdoc.)
 */
router.delete("/users/me/itineraries/:index", auth, async (req, res) => {
    try {
        const idx = Number(req.params.index);
        if (!Number.isInteger(idx) || idx < 0) {
            return res.status(400).json({ error: "index must be a non-negative integer" });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        if (!Array.isArray(user.saved_itineraries) || idx >= user.saved_itineraries.length) {
            return res.status(404).json({ error: "Itinerary index not found" });
        }

        user.saved_itineraries.splice(idx, 1);
        await user.save();

        return res.json({ status: "ok" });
    } catch (err) {
        console.error("DELETE users/me/itineraries/:index error:", err);
        return res.status(500).json({ error: "Failed to delete itinerary" });
    }
});

module.exports = router;
