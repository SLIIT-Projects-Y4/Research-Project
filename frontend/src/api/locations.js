// src/api/locations.js
import { api } from './client';

export async function listCities() {
  const { data } = await api.get('/api/locations/cities');
  return data; // { cities: [...] } or [...]
}

export async function lookupByName(name) {
  const { data } = await api.get('/api/locations/lookup', { params: { name } });
  return data; // { name, lat, lng, province?, city?, type?, avg_rating? }
}

export async function getById(location_id) {
  const { data } = await api.get(`/api/locations/${encodeURIComponent(location_id)}`);
  return data; // { location: {...normalized}, raw: {...full CSV row} }
}

