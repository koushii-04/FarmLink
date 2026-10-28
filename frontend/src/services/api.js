import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('farmlink_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle unauthenticated 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If expired token, clear storage
      // localStorage.removeItem('farmlink_token');
      // localStorage.removeItem('farmlink_user');
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const productsApi = {
  getAll: (params) => api.get('/products', { params }),
  getMyListings: () => api.get('/products/farmer/my-listings'),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

export const offersApi = {
  create: (data) => api.post('/offers', data),
  getMyOffers: (params) => api.get('/offers/my-offers', { params }),
  getById: (id) => api.get(`/offers/${id}`),
  counter: (id, data) => api.post(`/offers/${id}/counter`, data),
  accept: (id) => api.post(`/offers/${id}/accept`),
  reject: (id, data) => api.post(`/offers/${id}/reject`, null, { params: data }),
};

export const ordersApi = {
  createFromOffer: (offerId, data) => api.post(`/orders/from-offer/${offerId}`, data || {}),
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, data) => api.patch(`/orders/${id}/status`, data),
};

export const paymentsApi = {
  initiate: (orderId) => api.post('/payments/initiate', { order_id: orderId }),
  verify: (data) => api.post('/payments/verify', data),
  triggerWebhookReconciliation: (payload, signature) =>
    api.post('/payments/webhook', payload, {
      headers: { 'X-Razorpay-Signature': signature || 'simulated_wh_sig_test' },
    }),
};

export default api;
