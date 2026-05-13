import axios from 'axios';

const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Ensure the URL ends with /api (without duplicating it)
const baseURL = apiURL.endsWith('/api') ? apiURL : apiURL.replace(/\/$/, '') + '/api';

const api = axios.create({
  baseURL,
  withCredentials: true,
});

export default api;
