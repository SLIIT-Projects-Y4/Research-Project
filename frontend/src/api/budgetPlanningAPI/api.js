import axios from 'axios';

const API_BASE_URL = 'https://budget-tourism-view-520013428455.asia-south1.run.app/';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getHealth = () => api.get('/');

export const postPrediction = (tripData) => api.post('/predict', tripData);

export const getConfirmedPlans = () => api.get('/confirmed-plans');

export default api;

