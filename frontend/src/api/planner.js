// src/api/planner.js
import { api } from './client';

// POST /api/plan/generate with the exact ML body shape
export async function generatePlan(body) {
  // body example:
  // {
  //   start_city: 'Colombo' | null,
  //   end_city: 'Galle',
  //   plan_pool: ['Mirissa Beach', ...],
  //   include_city_attractions: true|false,
  //   min_attractions: 3,
  //   corridor_radius_km: 100,
  //   // optional override:
  //   start_lat: 6.9271,
  //   start_lng: 79.8612
  // }
  const { data } = await api.post('/api/plan/generate', body);
  return data;
}
