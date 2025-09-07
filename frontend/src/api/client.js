import axios from 'axios';
import { toast } from 'react-toastify';

const baseURL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      'Something went wrong';
    toast.error(`Request failed: ${msg}`);

    if (err?.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);
