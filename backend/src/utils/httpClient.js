const axios = require('axios');

const client = axios.create({
  baseURL: process.env.RECOMMENDER_API_URL || 'http://localhost:8000',
  timeout: 30000
});

client.interceptors.request.use((config) => {
  const token = process.env.RECOMMENDER_INTERNAL_TOKEN;
  if (token) config.headers['X-Internal-Token'] = token;
  return config;
});

module.exports = client;
