const { z } = require('../middlewares/validate');

const ItineraryOptionsSchema = z.object({
  location_name: z.string().min(1),
  included_provinces: z.array(z.string()).optional(),
  radius_km: z.number().min(1).max(300).default(50),
  top_n: z.number().int().min(1).max(25).default(5),
  start_lat: z.number().optional(),
  start_lng: z.number().optional(),
  end_lat: z.number().optional(),
  end_lng: z.number().optional(),
  corridor_radius_km: z.number().optional()
});

module.exports = { ItineraryOptionsSchema };
