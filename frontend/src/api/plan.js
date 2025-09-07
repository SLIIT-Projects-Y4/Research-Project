// src/api/plan.js
import { api } from './client';
export async function optimizePlan(body) {
  const { data } = await api.post('/api/plan/optimize', body);
  return data;
}
