// src/routes/preferences.routes.js
const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/preferences.controller');

router.get('/', auth, ctrl.getMine);
router.put('/', auth, ctrl.updateMine);

module.exports = router;
