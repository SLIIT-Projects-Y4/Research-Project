// src/routes/plannerProxy.js
const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const http = require('../utils/httpClient');

router.post('/plan/optimize', auth, async (req, res) => {
  try {
    const r = await http.post('/plan/optimize', req.body);
    const { data, status } = r;
    if (data && data.error) return res.status(400).json({ error: data.error });
    return res.status(status).json(data);
  } catch (err) {
    const msg = err?.response?.data?.error || err?.message || 'Planner service unavailable';
    console.error('POST /plan/optimize →', msg);
    return res.status(502).json({ error: msg });
  }
});

module.exports = router;
