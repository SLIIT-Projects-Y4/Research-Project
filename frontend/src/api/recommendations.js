// src/api/recommendations.js
import { api } from './client';

// Run + save recommendations on the server (calls ML via Node)
export async function fromProfile(top_n = 10) {
  const { data } = await api.post('/api/recommendations/from-profile', { top_n });
  // → { status: "ok", weights: {...}, results: [...], saved: true }
  return data;
}

// Read the last saved recommendations for the current user
export async function getSavedRecommendations() {
  const { data } = await api.get('/api/users/me/recommendations');
  // → { status: "ok", data: { results: [...], weights: {...}, generatedAt } | null }
  return data;
}
