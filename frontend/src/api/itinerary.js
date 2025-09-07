// src/api/itinerary.js
import { api } from './client';
export async function optionsForLocation(payload) {
  const { data } = await api.post('/api/itinerary/options', payload);
  return data;
}
