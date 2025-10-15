// src/routes/locations.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/locations.controller');

// If you want to restrict creation to admins, add your auth middleware here
router.get('/cities', ctrl.cities);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);

module.exports = router;
