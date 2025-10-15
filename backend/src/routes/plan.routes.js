const router = require('express').Router();
const { validate } = require('../middlewares/validate');
const { PlanGenerateSchema } = require('../schemas/plan');
const ctrl = require('../controllers/plan.controller');

router.post('/generate', validate({ body: PlanGenerateSchema }), ctrl.generate);
module.exports = router;
