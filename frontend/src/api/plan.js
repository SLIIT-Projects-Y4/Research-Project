// src/api/plan.js
import { api } from './client';
export async function optimizePlan(body) {
  const { data } = await api.post('http://localhost:8000/plan/optimize', body);
  return data;
}
