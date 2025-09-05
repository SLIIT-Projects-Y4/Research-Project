// src/api/recommendations.js
import { api } from './client';

export async function fromProfile(top_n = 10) {
  const { data } = await api.post('/api/recommendations/from-profile', { top_n });
  return data; // { status, weights, results }
}
