const router = require('express').Router();

router.use('/plan', require('./plan.routes'));
router.use('/optimize', require('./optimize.routes'));
router.use('/itinerary', require('./itinerary.routes'));
router.use('/locations', require('./locations.routes'));

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./users.routes'));

router.use('/recommendation', require('./recommendation.routes'));
router.use('/preferences', require('./preference.routes'));

module.exports = router;
