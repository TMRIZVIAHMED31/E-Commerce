import axios from 'axios';

const localApiUrl = 'http://localhost:5000/api';
const productionApiUrl = 'https://e-commerce-lk03.onrender.com/api';
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

export const apiBaseUrl =
  configuredApiUrl ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? localApiUrl
    : productionApiUrl);
export const apiOrigin = apiBaseUrl.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: apiBaseUrl,
});

// Attach the JWT (if present) to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
