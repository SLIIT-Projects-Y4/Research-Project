// src/api/itinerary.js
import { api } from './client';
export async function optionsForLocation(payload) {
  const { data } = await api.post('/api/itinerary/options', payload);
  return data;
}

export async function saveItinerary(plan, title) {
  const { data } = await api.post('/api/itineraries', { title, plan });
  return data?.data ?? data;
}
export async function getItineraries() {
  return api.get('/api/itineraries');
}
export async function deleteItineraryByIndex(index) {
  return api.delete(`/api/itineraries/${index}`);
}