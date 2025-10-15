import { api } from './client';

export async function register(payload) {
  const { data } = await api.post('/api/auth/register', payload);
  return data;
}

export async function login(payload) {
  const { data } = await api.post('/api/auth/login', payload);
  return data;
}

export async function getMe() {
  const { data } = await api.get('/api/users/me');
  return data;
}

export async function refreshAuth() {
  // Optional endpoint; will 404 if you haven't implemented it in backend yet.
  const { data } = await api.post('/api/auth/refresh');
  // expected: { token, user }
  return data;
}