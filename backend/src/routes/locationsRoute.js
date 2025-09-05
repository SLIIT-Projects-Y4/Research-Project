// routes/locationsRoute.js
const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const User = require('../models/userModel');
const http = require('../utils/httpClient'); // already used in reco proxy; base = RECOMMENDER_API_URL

// GET /api/locations/cities
// Tries ML meta endpoint (/meta/cities). Falls back to cities found in the current user's data.
router.get('/locations/cities', auth, async (req, res) => {
  try {
    const set = new Set();

    // 1) Try ML for a canonical list
    try {
      const r = await http.get('/meta/cities'); // adjust if your ML path differs
      const arr = Array.isArray(r?.data?.data) ? r.data.data : [];
      arr.forEach((c) => c && set.add(String(c).trim()));
    } catch {
      // ignore; we'll fall back below
    }

    // 2) Merge user-sourced cities as a fallback
    const user = await User.findById(
      req.user.id,
      'plan_pool recommended_locations last_recommendations'
    ).lean();

    const addCity = (c) => {
      if (c && typeof c === 'string') set.add(c.trim());
    };

    (user?.plan_pool || []).forEach((x) => addCity(x.city));
    (user?.recommended_locations || []).forEach((x) => addCity(x.city));
    (user?.last_recommendations?.results || []).forEach((x) => addCity(x.city));

    const list = Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b));

    return res.json({ status: 'ok', data: list });
  } catch (err) {
    console.error('GET /locations/cities error:', err.message || err);
    return res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

module.exports = router;
