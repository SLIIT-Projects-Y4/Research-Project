// src/routes/itineraryProxy.js
const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const http = require('../utils/httpClient');

router.post('/itinerary/options', auth, async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.location_name || !String(body.location_name).trim()) {
      return res.status(400).json({ error: 'location_name is required' });
    }
    const r = await http.post('/itinerary/options', body);
    return res.status(r.status).json(r.data);
  } catch (err) {
    const msg = err?.response?.data?.error || err?.message || 'Itinerary service unavailable';
    console.error('POST /itinerary/options →', msg);
    return res.status(502).json({ error: msg });
  }
});

module.exports = router;
