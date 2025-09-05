// src/api/planpool.js
import { api } from './client';

export async function getPlanPool() {
  const { data } = await api.get('/api/users/me/plan-pool');
  return data;
}

export async function addToPlanPool(item) {
  const { data } = await api.post('/api/users/me/plan-pool', item);
  return data;
}

export async function removeFromPlanPool(location_id) {
  const { data } = await api.delete(`/api/users/me/plan-pool/${encodeURIComponent(location_id)}`);
  return data;
}
