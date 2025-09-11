const { z } = require('../middlewares/validate');

const StopSchema = z.object({
  name: z.string(),
  lat: z.number(),
  lng: z.number()
}).passthrough();

const OptimizeSchema = z.object({
  itinerary: z.array(StopSchema).min(2)
});

module.exports = { OptimizeSchema };
