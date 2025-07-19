import axios from 'axios';

// In all environments, use the environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

console.log('🔧 API Base URL:', API_BASE_URL);
console.log(
  '🔧 Environment:',
  import.meta.env.DEV ? 'Development' : 'Production'
);

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(
      `Making request to: ${config.method?.toUpperCase()} ${config.url}`
    );
    console.log(`Full URL: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 errors
axiosInstance.interceptors.response.use(
  (response) => {
    // Only log in development
    if (import.meta.env.DEV) {
      console.log(`Response received: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    // Only log errors in development
    if (import.meta.env.DEV) {
      console.error('Response error:', error.message, error.config?.url);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
    }

    // Only handle 401 errors for non-auth endpoints to prevent infinite redirects
    if (
      error.response?.status === 401 &&
      !error.config.url.includes('/auth/')
    ) {
      localStorage.removeItem('token');
      // Use window.location.replace instead of href to prevent adding to history
      window.location.replace('/login');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
