import { api } from './client';

export async function getMyPreferences() {
  const { data } = await api.get('/api/users/me/preferences');
  return data;
}

export async function updateMyPreferences(payload) {
  const { data } = await api.put('/api/users/me/preferences', payload);
  return data;
}
