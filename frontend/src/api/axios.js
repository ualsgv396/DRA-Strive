import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, 
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('strive_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.method === 'get') {
      config.headers['Cache-Control'] = 'no-cache';
      config.headers['Pragma'] = 'no-cache';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('strive_token');
      localStorage.removeItem('strive_usuario');
      window.location.href = '/login';
    }
    if (error.response?.status === 403) {
      error.isForbidden = true;
    }
    return Promise.reject(error);
  }
);

export default api;