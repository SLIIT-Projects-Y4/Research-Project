import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getHealth = () => api.get('/');

export const postPrediction = (tripData) => api.post('/predict', tripData);

export const getConfirmedPlans = () => api.get('/confirmed-plans');

export default api;

