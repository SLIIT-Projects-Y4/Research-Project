// src/routes/recommendations.routes.js
const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const User = require('../models/User');
const http = require('../utils/httpClient');
const { ok, fail } = require('../utils/response');

// Robust mapper (handles ML variants: Location_ID vs location_id, etc.)
function toArrayMaybe(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') {
    try { const p = JSON.parse(v); if (Array.isArray(p)) return p; } catch {}
    return v.split(/[;,|]/).map(s => s.trim()).filter(Boolean);
  }
  return [];
}
function mapMlLocation(r = {}) {
  return {
    location_id: r.location_id ?? r.Location_ID ?? null,
    name: r.name ?? r.Location_Name ?? '',
    province: r.province ?? r.Located_Province ?? '',
    city: r.city ?? r.located_city ?? r.City ?? '',
    lat: r.lat ?? r.Latitude ?? null,
    lng: r.lng ?? r.Longitude ?? null,
    avg_rating: r.avg_rating ?? r.Avg_Rating ?? null,
    rating_count: r.rating_count ?? r.Review_Count ?? null,
    description: r.description ?? r.Location_Description ?? '',
    activities: toArrayMaybe(r.activities ?? r.Activities),
    final_score: r.final_score ?? r.Final_Score ?? null
  };
}

// helper: call ML /recommendations, fallback to /
async function callMLRecommendations(payload) {
  try {
    // most setups expose /recommendations
    return await http.post('/recommendations', payload);
  } catch (err) {
    if (err?.response?.status === 404) {
      // legacy setups use root /
      return await http.post('/', payload);
    }
    throw err;
  }
}

// From stored profile (preferred path)
router.post('/from-profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json(fail('NOT_FOUND', 'User not found'));

    const { age_group, gender, travel_companion, preferred_activities } = user;
    const okActs = Array.isArray(preferred_activities) && preferred_activities.length >= 2;

    if (!age_group || !gender || !travel_companion || !okActs) {
      return res.status(400).json(fail(
        'PREFS_INCOMPLETE',
        'Please complete preferences: age_group, gender, travel_companion, preferred_activities (>=2)'
      ));
    }

    const top_n = Number(req.body?.top_n ?? req.query?.top_n ?? 9);
    const input = { age_group, gender, travel_companion, preferred_activities, top_n };

    const r = await callMLRecommendations(input);
    const ml = r?.data || {};
    const weights = ml?.weights ?? null;
    const mlResults = Array.isArray(ml?.results) ? ml.results : [];

    const normalized = mlResults.map(mapMlLocation);

    await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          last_recommendations: {
            generated_at: new Date(),
            input,
            weights,
            results: normalized
          },
          recommended_locations: normalized
        }
      },
      { new: false }
    );

    // return ML payload inside our envelope
    return res.json(ok({
      status: ml.status ?? 'ok',
      weights,
      results: mlResults,
      saved: true
    }));
  } catch (err) {
    console.error('recommendations.from-profile error:', err?.response?.data || err.message);
    return res.status(502).json(fail('UPSTREAM_ERROR', 'Recommendation service unavailable'));
  }
});

// What-if (overrides in body; does NOT mutate user profile)
router.post('/', auth, async (req, res) => {
  try {
    const { age_group, gender, travel_companion, preferred_activities, top_n = 10 } = req.body || {};
    const okActs = Array.isArray(preferred_activities) && preferred_activities.length >= 2;
    if (!age_group || !gender || !travel_companion || !okActs) {
      return res.status(400).json(fail(
        'VALIDATION_ERROR',
        'Body must include age_group, gender, travel_companion, preferred_activities (>=2)'
      ));
    }
    const payload = {
      age_group: String(age_group).trim(),
      gender: String(gender).trim(),
      travel_companion: String(travel_companion).trim(),
      preferred_activities: preferred_activities.map((s) => String(s).trim()),
      top_n: Number(top_n)
    };

    const r = await callMLRecommendations(payload);
    return res.status(200).json(ok(r.data));
  } catch (err) {
    console.error('recommendations.what-if error:', err?.response?.data || err.message);
    return res.status(502).json(fail('UPSTREAM_ERROR', 'Recommendation service unavailable'));
  }
});

router.get('/healthz', (_req, res) => res.json(ok({ status: 'ok' })));

module.exports = router;
