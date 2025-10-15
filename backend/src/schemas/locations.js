const { z } = require('../middlewares/validate');
const LocationIdParamSchema = z.object({ id: z.string().min(1) });
module.exports = { LocationIdParamSchema };
