import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Categories API
export const categoriesApi = {
  getAll: (status) => api.get('/api/categories', { params: { status } }),
  getById: (id) => api.get(`/api/categories/${id}`),
  create: (data) => api.post('/api/categories', data),
  update: (id, data) => api.put(`/api/categories/${id}`, data),
  delete: (id, permanent = false) => api.delete(`/api/categories/${id}`, { params: { permanent } }),
};

// Products API
export const productsApi = {
  getAll: (params) => api.get('/api/products', { params }),
  getById: (id) => api.get(`/api/products/${id}`),
  create: (data) => api.post('/api/products', data),
  update: (id, data) => api.put(`/api/products/${id}`, data),
  delete: (id, permanent = false) => api.delete(`/api/products/${id}`, { params: { permanent } }),
};

// Analytics API
export const analyticsApi = {
  get: () => api.get('/api/analytics'),
};

// Settings API
export const settingsApi = {
  getLanguage: () => api.get('/api/settings/language'),
  updateLanguage: (data) => api.put('/api/settings/language', data),
  getPayment: () => api.get('/api/settings/payment'),
  updatePayment: (data) => api.put('/api/settings/payment', data),
};

// Archive API
export const archiveApi = {
  getAll: () => api.get('/api/archive'),
  restore: (type, id) => api.post(`/api/restore/${type}/${id}`),
};

export default api;
