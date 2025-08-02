import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';  // Change if deployed

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getHealth = () => api.get('/');

export const postPrediction = (tripData) => api.post('/predict', tripData);

export default api;