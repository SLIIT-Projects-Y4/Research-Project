const router = require('express').Router();
const { validate } = require('../middlewares/validate');
const { OptimizeSchema } = require('../schemas/optimize');
const ctrl = require('../controllers/optimize.controller');

router.post('/', validate({ body: OptimizeSchema }), ctrl.optimize);
module.exports = router;
