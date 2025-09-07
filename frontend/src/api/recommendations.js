import { api } from './client';

export async function fromProfile(top_n = 10) {
  const { data } = await api.post('/api/recommendations/from-profile', { top_n });
  return data;
}

export async function getSavedRecommendations() {
  const { data } = await api.get('/api/users/me/recommendations');
  return data;
}
