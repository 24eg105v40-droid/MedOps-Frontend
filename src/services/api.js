import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT Bearer Token to outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('medops_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session expiration (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect if necessary
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('medops_token');
        localStorage.removeItem('medops_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (data) => api.post('/api/auth/register', data),
  getProfile: () => api.get('/api/auth/me'),
  getAllUsers: () => api.get('/api/auth/users'),
};

export const medicineApi = {
  getMedicines: (params) => api.get('/api/medicines', { params }),
  getAllActive: () => api.get('/api/medicines/all'),
  getById: (id) => api.get(`/api/medicines/${id}`),
  create: (data) => api.post('/api/medicines', data),
  update: (id, data) => api.put(`/api/medicines/${id}`, data),
  delete: (id) => api.delete(`/api/medicines/${id}`),
  getCategories: () => api.get('/api/medicines/categories'),
};

export const batchApi = {
  getAll: () => api.get('/api/batches'),
  getByMedicine: (medicineId) => api.get(`/api/batches/medicine/${medicineId}`),
  getFefo: (medicineId) => api.get(`/api/batches/medicine/${medicineId}/fefo`),
  getExpiring: (days = 60) => api.get(`/api/batches/expiring?days=${days}`),
  create: (data) => api.post('/api/batches', data),
  update: (id, data) => api.put(`/api/batches/${id}`, data),
  runAutoExpireCheck: () => api.post('/api/batches/auto-expire-check'),
};

export const inventoryApi = {
  getTransactions: (params) => api.get('/api/inventory/transactions', { params }),
  getMedicineTransactions: (medicineId) => api.get(`/api/inventory/transactions/medicine/${medicineId}`),
  recordUsage: (data) => api.post('/api/inventory/usage', data),
  adjustStock: (data) => api.post('/api/inventory/adjust', data),
};

export const supplierApi = {
  getAll: () => api.get('/api/suppliers'),
  getById: (id) => api.get(`/api/suppliers/${id}`),
  create: (data) => api.post('/api/suppliers', data),
  update: (id, data) => api.put(`/api/suppliers/${id}`, data),
  delete: (id) => api.delete(`/api/suppliers/${id}`),
};

export const purchaseOrderApi = {
  getAll: () => api.get('/api/purchase-orders'),
  getById: (id) => api.get(`/api/purchase-orders/${id}`),
  create: (data) => api.post('/api/purchase-orders', data),
  updateStatus: (id, status) => api.patch(`/api/purchase-orders/${id}/status?status=${status}`),
  receive: (data) => api.post('/api/purchase-orders/receive', data),
};

export const aiApi = {
  getExpiryRisks: () => api.get('/api/ai/expiry-risks'),
  getStockoutRisks: () => api.get('/api/ai/stockout-risks'),
  getDemandForecast: (medicineId) => api.get(`/api/ai/forecast/${medicineId}`),
  getFefoRecommendation: (medicineId, quantity) => api.get(`/api/ai/fefo-recommendation/${medicineId}?quantity=${quantity}`),
  getSupplierInsights: () => api.get('/api/ai/supplier-insights'),
  chat: (data) => api.post('/api/ai/chat', data),
  getAlerts: (params) => api.get('/api/ai/alerts', { params }),
  resolveAlert: (id) => api.post(`/api/ai/alerts/${id}/resolve`),
};

export const knowledgeApi = {
  getAll: () => api.get('/api/knowledge'),
  getById: (id) => api.get(`/api/knowledge/${id}`),
  create: (data) => api.post('/api/knowledge', data),
};

export const dashboardApi = {
  getSummary: () => api.get('/api/dashboard/summary'),
};

export const auditApi = {
  getLogs: (params) => api.get('/api/audit', { params }),
  getRecent: () => api.get('/api/audit/recent'),
};

export default api;
