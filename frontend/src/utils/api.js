import axios from 'axios';

let apiURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Normalize URL: trim whitespace and ensure protocol for production
apiURL = apiURL.trim();
if (apiURL && !apiURL.startsWith('http')) {
  apiURL = `https://${apiURL}`;
}

// Clean trailing slashes and ensure /api
const baseURL = apiURL.replace(/\/+$/, '').replace(/\/api$/, '') + '/api';

const api = axios.create({
  baseURL,
  withCredentials: true,
});

export default api;

