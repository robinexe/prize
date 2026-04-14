import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — inject token
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — auto refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });

        await SecureStore.setItemAsync('accessToken', data.accessToken);
        await SecureStore.setItemAsync('refreshToken', data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        // Navigate to login
      }
    }

    return Promise.reject(error);
  },
);

export default api;

// ============================================
// API Services
// ============================================

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) =>
    api.post('/auth/register', data),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  logout: () =>
    api.post('/auth/logout'),
};

export const boatsApi = {
  list: (page?: number) =>
    api.get('/boats', { params: { page } }),
  myBoats: () =>
    api.get('/boats/my-boats'),
  getById: (id: string) =>
    api.get(`/boats/${id}`),
  available: (startDate: string, endDate: string) =>
    api.get('/boats/available', { params: { startDate, endDate } }),
};

export const reservationsApi = {
  create: (data: { boatId: string; startDate: string; endDate: string; notes?: string }) =>
    api.post('/reservations', data),
  myReservations: (upcoming?: boolean) =>
    api.get('/reservations/my-reservations', { params: { upcoming } }),
  calendar: (boatId: string, month: number, year: number) =>
    api.get(`/reservations/calendar/${boatId}`, { params: { month, year } }),
  cancel: (id: string, reason?: string) =>
    api.patch(`/reservations/${id}/cancel`, { reason }),
};

export const financeApi = {
  myCharges: (status?: string) =>
    api.get('/finance/my-charges', { params: { status } }),
  dashboard: () =>
    api.get('/finance/dashboard'),
  delinquents: () =>
    api.get('/finance/delinquents'),
};

export const queueApi = {
  enter: (data: { boatId: string; reservationId?: string }) =>
    api.post('/queue/enter', data),
  today: (boatId?: string) =>
    api.get('/queue/today', { params: { boatId } }),
  myPosition: () =>
    api.get('/queue/my-position'),
  updateStatus: (id: string, status: string) =>
    api.patch(`/queue/${id}/status`, { status }),
};

export const fuelApi = {
  log: (data: { boatId: string; liters: number; pricePerLiter?: number; hourMeter?: number }) =>
    api.post('/fuel', data),
  byBoat: (boatId: string) =>
    api.get(`/fuel/boat/${boatId}`),
};

export const aiApi = {
  chat: (message: string, context?: string) =>
    api.post('/ai/chat', { message, context }),
  insights: () =>
    api.get('/ai/insights'),
  explainCharge: (chargeId: string) =>
    api.get(`/ai/explain-charge/${chargeId}`),
};

export const notificationsApi = {
  list: (page?: number) =>
    api.get('/notifications', { params: { page } }),
  markRead: (id: string) =>
    api.patch(`/notifications/${id}/read`),
  markAllRead: () =>
    api.patch('/notifications/read-all'),
};
