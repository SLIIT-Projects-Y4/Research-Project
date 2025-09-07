import { api } from './client';

export async function generatePlan(body) {
  const { data } = await api.post('/api/plan/generate', body);
  return data;
}
