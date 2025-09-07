import { api } from './client';

export async function saveItinerary(plan, title) {
  const { data } = await api.post('/api/users/me/itineraries', { plan, title });
  return data;
}

export async function getItineraries() {
  const { data } = await api.get('/api/users/me/itineraries');
  return data;
}

export async function deleteItineraryByIndex(index) {
  const { data } = await api.delete(`/api/users/me/itineraries/${index}`);
  return data;
}
