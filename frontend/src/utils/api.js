import axios from 'axios';

// Use relative URL for Vercel (same domain) or fallback to environment variable
const API_BASE_URL = process.env.REACT_APP_API_URL || (typeof window !== 'undefined' ? '' : 'http://localhost:5000');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Don't set Content-Type for FormData, let browser set it with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log the error for debugging
    console.error('API Error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
      baseURL: error.config?.baseURL
    });

    if (error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
      const baseURL = error.config?.baseURL || API_BASE_URL;
      error.message = `Cannot connect to server at ${baseURL}. Please check your REACT_APP_API_URL environment variable.`;
    } else if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || error.response.data?.error || 'Request failed';
      error.message = message;
    } else if (error.request) {
      // Request made but no response received
      error.message = 'No response from server. Please check if the backend is running and accessible.';
    }
    return Promise.reject(error);
  }
);

export default api;
