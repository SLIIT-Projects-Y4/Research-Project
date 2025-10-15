const router = require('express').Router();
const { validate } = require('../middlewares/validate');
const { ItineraryOptionsSchema } = require('../schemas/itinerary');
const ctrl = require('../controllers/itinerary.controller');

router.post('/options', validate({ body: ItineraryOptionsSchema }), ctrl.options);
module.exports = router;
