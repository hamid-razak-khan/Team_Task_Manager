import axios from 'axios';

const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const apiURL = import.meta.env.VITE_API_URL || 
               (isLocal ? 'http://localhost:5000/api' : 'https://teamtaskmanager-production-76cd.up.railway.app/api');

// Ensure the URL ends with /api (without duplicating it)
const baseURL = apiURL.endsWith('/api') ? apiURL : apiURL.replace(/\/$/, '') + '/api';

const api = axios.create({
  baseURL,
  withCredentials: true,
});

export default api;
