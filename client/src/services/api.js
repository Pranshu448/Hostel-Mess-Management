import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
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
  getQr: (token, mealType) =>
    api.get(`/attendance/qr${mealType ? `?mealType=${mealType}` : ''}`, authConfig(token)).then((r) => r.data),
  mark: (token, payload) => api.post('/attendance/mark', payload, authConfig(token)).then((r) => r.data),
  listByDate: (token, date, mealType) =>
    api
      .get(`/attendance/list?date=${date}${mealType ? `&mealType=${mealType}` : ''}`, authConfig(token))
      .then((r) => r.data),
};

export const menuAPI = {
  getWeekly: (token) => api.get('/menu/weekly', authConfig(token)).then((r) => r.data),
  saveWeekly: (token, payload) => api.post('/menu/weekly', payload, authConfig(token)).then((r) => r.data),
  getNutrition: (token) => api.get('/menu/nutrition', authConfig(token)).then((r) => r.data),
  saveNutrition: (token, payload) => api.post('/menu/nutrition', payload, authConfig(token)).then((r) => r.data),
  getDailyItems: (token, date) => api.get(`/menu/daily-items?date=${date || ''}`, authConfig(token)).then((r) => r.data),
  addDailyItem: (token, payload) => api.post('/menu/daily-items', payload, authConfig(token)).then((r) => r.data),
  toggleDailyItem: (token, id) => api.patch(`/menu/daily-items/${id}/toggle`, {}, authConfig(token)).then((r) => r.data),
  deleteDailyItem: (token, id) => api.delete(`/menu/daily-items/${id}`, authConfig(token)).then((r) => r.data),
};

export const ratingsAPI = {
  getDishes: (token) => api.get('/ratings/dishes', authConfig(token)).then((r) => r.data),
  list: (token) => api.get('/ratings', authConfig(token)).then((r) => r.data),
  submit: (token, payload) => api.post('/ratings', payload, authConfig(token)).then((r) => r.data),
};

export const mlAPI = {
  generateMenu: (token, payload) => api.post('/ml/menu/generate', payload || {}, authConfig(token)).then((r) => r.data),
  forecastAttendance: (token) => api.get('/ml/attendance/forecast', authConfig(token)).then((r) => r.data),
  forecastDemand: (token) => api.get('/ml/inventory/demand-forecast', authConfig(token)).then((r) => r.data),
  listModels: (token) => api.get('/ml/models', authConfig(token)).then((r) => r.data),
};

export const analyticsAPI = {
  student: (token) => api.get('/analytics/student', authConfig(token)).then((r) => r.data),
  admin: (token) => api.get('/analytics/admin', authConfig(token)).then((r) => r.data),
};

export const wasteAPI = {
  list: (token) => api.get('/waste', authConfig(token)).then((r) => r.data),
  save: (token, payload) => api.post('/waste', payload, authConfig(token)).then((r) => r.data),
  predict: (token) => api.get('/waste/predict', authConfig(token)).then((r) => r.data),
};

export const qrAPI = {
  scan: (token, payload) => api.post('/qr/scan', payload, authConfig(token)).then((r) => r.data),
  validate: (token, payload) => api.post('/qr/validate', payload, authConfig(token)).then((r) => r.data),
};

export const paymentAPI = {
  getMine: (token) => api.get('/payments/me', authConfig(token)).then((r) => r.data),
  payNow: (token) => api.post('/payments/pay', {}, authConfig(token)).then((r) => r.data),
  list: (token) => api.get('/payments/all', authConfig(token)).then((r) => r.data),
  markPaid: (token, studentId) => api.post('/payments/mark-paid', { studentId }, authConfig(token)).then((r) => r.data),
  processScan: (token, payload) => api.post('/payments/scan-transaction', payload, authConfig(token)).then((r) => r.data),
  getTransactions: (token) => api.get('/payments/transactions/me', authConfig(token)).then((r) => r.data),
  getAdminTransactions: (token) => api.get('/payments/transactions/admin', authConfig(token)).then((r) => r.data),
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
  remove: (token, id) => api.delete(`/inventory/${id}`, authConfig(token)).then((r) => r.data),
};

export const adminAPI = {
  overview: (token) => api.get('/admin/overview', authConfig(token)).then((r) => r.data),
};

export default api;
