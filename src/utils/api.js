import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

// Response caching
const cache = new Map();

api.interceptors.request.use((config) => {
  if (config.method === 'get') {
    const cached = cache.get(config.url);
    if (cached && Date.now() - cached.timestamp < 300000) {
      // 5 minute cache
      config.adapter = () =>
        Promise.resolve({
          data: cached.data,
          status: 200,
          statusText: 'OK (cached)',
          headers: {},
          config,
        });
    }
  }
  return config;
});

api.interceptors.response.use((response) => {
  if (response.config.method === 'get') {
    cache.set(response.config.url, {
      data: response.data,
      timestamp: Date.now(),
    });
  }
  return response;
});

export default api;
