// src/routes/locationsProxy.js
const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const http = require('../utils/httpClient');

// GET /api/locations/cities -> proxy to ML
router.get('/locations/cities', auth, async (_req, res) => {
  try {
    const r = await http.get('/locations/cities');
    return res.status(r.status).json(r.data);
  } catch (err) {
    const msg = err?.response?.data?.error || err?.message || 'Locations service unavailable';
    console.error('GET /locations/cities →', msg);
    return res.status(502).json({ error: msg });
  }
});

// GET /api/locations/lookup?name=Mirissa Beach -> proxy to ML, returns lat/lng for a single place
router.get('/locations/lookup', auth, async (req, res) => {
  try {
    const name = (req.query.name || '').trim();
    if (!name) return res.status(400).json({ error: 'name is required' });
    const r = await http.get('/locations/lookup', { params: { name } });
    return res.status(r.status).json(r.data);
  } catch (err) {
    const msg = err?.response?.data?.error || err?.message || 'Lookup failed';
    console.error('GET /locations/lookup →', msg);
    return res.status(502).json({ error: msg });
  }
});

module.exports = router;
