import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

const authConfig = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const authAPI = {
  signup: async (userData) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  getMe: async (token) => {
    const response = await api.get('/auth/me', authConfig(token));
    return response.data;
  },
};

export const attendanceAPI = {
  getMine: (token) => api.get('/attendance/me', authConfig(token)).then((r) => r.data),
  getQr: (token) => api.get('/attendance/qr', authConfig(token)).then((r) => r.data),
  mark: (token, payload) => api.post('/attendance/mark', payload, authConfig(token)).then((r) => r.data),
  listByDate: (token, date) => api.get(`/attendance/list?date=${date}`, authConfig(token)).then((r) => r.data),
};

export const menuAPI = {
  getWeekly: (token) => api.get('/menu/weekly', authConfig(token)).then((r) => r.data),
  saveWeekly: (token, payload) => api.post('/menu/weekly', payload, authConfig(token)).then((r) => r.data),
  getForm: (token) => api.get('/menu/preferences/form', authConfig(token)).then((r) => r.data),
  createForm: (token, payload) => api.post('/menu/preferences/form', payload, authConfig(token)).then((r) => r.data),
  submitPrefs: (token, payload) => api.post('/menu/preferences/submit', payload, authConfig(token)).then((r) => r.data),
  suggestions: (token) => api.get('/menu/preferences/suggestions', authConfig(token)).then((r) => r.data),
};

export const paymentAPI = {
  getMine: (token) => api.get('/payments/me', authConfig(token)).then((r) => r.data),
  payNow: (token) => api.post('/payments/pay', {}, authConfig(token)).then((r) => r.data),
  list: (token) => api.get('/payments/all', authConfig(token)).then((r) => r.data),
  markPaid: (token, studentId) => api.post('/payments/mark-paid', { studentId }, authConfig(token)).then((r) => r.data),
};

export const feedbackAPI = {
  create: (token, payload) => api.post('/feedback', payload, authConfig(token)).then((r) => r.data),
  mine: (token) => api.get('/feedback/me', authConfig(token)).then((r) => r.data),
  list: (token) => api.get('/feedback/all', authConfig(token)).then((r) => r.data),
  resolve: (token, id, adminResponse) =>
    api.patch(`/feedback/${id}/resolve`, { adminResponse }, authConfig(token)).then((r) => r.data),
};

export const crowdAPI = {
  get: (token) => api.get('/crowd', authConfig(token)).then((r) => r.data),
  update: (token, level) => api.post('/crowd', { level }, authConfig(token)).then((r) => r.data),
};

export const inventoryAPI = {
  list: (token) => api.get('/inventory', authConfig(token)).then((r) => r.data),
  upsert: (token, payload) => api.post('/inventory', payload, authConfig(token)).then((r) => r.data),
};

export const adminAPI = {
  overview: (token) => api.get('/admin/overview', authConfig(token)).then((r) => r.data),
};

export default api;
