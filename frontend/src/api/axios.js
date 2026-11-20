import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

let navigate = null;

// Dynamically import router only when needed
const getNavigate = () => {
  if (!navigate) {
    try {
      const { useNavigate } = require('react-router-dom');
      navigate = useNavigate();
    } catch (e) {
      // Outside React component
    }
  }
  return navigate;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('booknest_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const isFormData = config.data instanceof FormData;
  if (!isFormData) {
    config.headers['Content-Type'] = 'application/json';
  }

  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('booknest_token');
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/admin/login' && currentPath !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
