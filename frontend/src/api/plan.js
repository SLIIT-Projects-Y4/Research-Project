// src/api/plan.js
import { api } from './client';
export async function optimizePlan(body) {
  const { data } = await api.post('https://ai-tourism-view-520013428455.asia-south1.run.app/plan/optimize', body);
  return data;
}
