const axios = require("axios");

const BASE = process.env.RECOMMENDER_API_URL || "http://localhost:8000";
const INTERNAL_TOKEN = process.env.RECOMMENDER_INTERNAL_TOKEN || null;

const client = axios.create({
  baseURL: BASE,
  timeout: 120000,
});

client.interceptors.request.use((config) => {
  if (INTERNAL_TOKEN) config.headers["X-Internal-Token"] = INTERNAL_TOKEN;
  return config;
});

module.exports = client;
