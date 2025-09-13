import { api } from './client';

export async function getMyPreferences() {
  const { data } = await api.get('/api/preferences');
  return data;
}

export async function updateMyPreferences(payload) {
  const { data } = await api.put('/api/preferences', payload);
  return data;
}
