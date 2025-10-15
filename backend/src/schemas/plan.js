const { z } = require('../middlewares/validate');

const PlanGenerateSchema = z.object({
  end_city: z.string().min(1),
  plan_pool: z.array(z.string()).nonempty(),
  start_city: z.string().min(1).optional(),
  use_current_location: z.boolean().optional(),
  start_lat: z.number().optional(),
  start_lng: z.number().optional(),
  include_city_attractions: z.boolean().optional(),
  city_attraction_radius_km: z.number().nullable().optional(),
  min_attractions: z.number().int().min(1).optional(),
  corridor_radius_km: z.number().min(1).optional(),
  top_fill_per_city: z.number().int().min(1).optional()
}).refine((d) => d.start_city || (d.use_current_location && typeof d.start_lat === 'number' && typeof d.start_lng === 'number'), {
  message: 'Provide start_city OR (use_current_location=true AND start_lat/start_lng).'
});

module.exports = { PlanGenerateSchema };
