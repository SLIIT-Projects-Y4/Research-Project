// routes/planRoute.js
const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const User = require('../models/userModel');
const http = require('../utils/httpClient'); // axios preconfigured to RECOMMENDER_API_URL

// Validate payload shape per ML service
function validate(body) {
  if (!body) return 'Missing body';
  const {
    start_city,
    end_city,
    plan_pool,
    include_city_attractions,
    min_attractions,
    corridor_radius_km,
    start_lat,
    start_lng,
    city_attraction_radius_km, // optional in ML
  } = body;

  if (!end_city || typeof end_city !== 'string') return 'end_city (string) is required';
  if (!(corridor_radius_km > 0)) return 'corridor_radius_km must be > 0';
  if (min_attractions != null && Number(min_attractions) < 0) return 'min_attractions must be >= 0';
  if (include_city_attractions != null && typeof include_city_attractions !== 'boolean')
    return 'include_city_attractions must be boolean';

  if (start_lat != null || start_lng != null) {
    if (typeof start_lat !== 'number' || typeof start_lng !== 'number') {
      return 'start_lat and start_lng must both be numbers when provided';
    }
  }
  if (city_attraction_radius_km != null && !(city_attraction_radius_km > 0))
    return 'city_attraction_radius_km must be > 0 when provided';

  return null;
}

router.post('/plan/generate', auth, async (req, res) => {
  try {
    // Make the body match ML exactly, filling sensible defaults
    let {
      start_city = null,
      end_city,
      plan_pool,
      include_city_attractions = false,
      min_attractions = 3,
      corridor_radius_km,
      start_lat,
      start_lng,
      city_attraction_radius_km, // optional
    } = req.body || {};

    // If frontend didn't send plan_pool, derive from user's stored plan_pool (names only)
    if (!Array.isArray(plan_pool) || plan_pool.length === 0) {
      const user = await User.findById(req.user.id, 'plan_pool').lean();
      plan_pool = Array.isArray(user?.plan_pool)
        ? user.plan_pool.map((x) => x?.name).filter(Boolean)
        : [];
    }

    const err = validate({
      start_city,
      end_city,
      plan_pool,
      include_city_attractions,
      min_attractions,
      corridor_radius_km,
      start_lat,
      start_lng,
      city_attraction_radius_km,
    });
    if (err) return res.status(400).json({ error: err });

    // Build final body for ML
    const mlBody = {
      start_city, // may be null if start_lat/lng provided
      end_city,
      plan_pool, // array of strings (location names)
      include_city_attractions: !!include_city_attractions,
      min_attractions: Number(min_attractions),
      corridor_radius_km: Number(corridor_radius_km),
    };

    if (typeof start_lat === 'number' && typeof start_lng === 'number') {
      mlBody.start_lat = Number(start_lat);
      mlBody.start_lng = Number(start_lng);
    }
    if (typeof city_attraction_radius_km === 'number') {
      mlBody.city_attraction_radius_km = Number(city_attraction_radius_km);
    }

    // Proxy to ML
    const r = await http.post('/plan/generate', mlBody);
    return res.status(200).json(r.data);
  } catch (e) {
    console.error('POST /plan/generate → ML error:', e?.response?.data || e.message);
    return res.status(502).json({ error: 'Planner service unavailable' });
  }
});

module.exports = router;
