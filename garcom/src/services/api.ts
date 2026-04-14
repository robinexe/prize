import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.marinaprizeclub.com/api/v1';

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('garcom_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('garcom_refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
          localStorage.setItem('garcom_token', data.accessToken);
          localStorage.setItem('garcom_refreshToken', data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('garcom_token');
          localStorage.removeItem('garcom_refreshToken');
          localStorage.removeItem('garcom_user');
          window.location.href = 'https://marinaprizeclub.com/login';
        }
      } else {
        window.location.href = 'https://marinaprizeclub.com/login';
      }
    }
    return Promise.reject(error);
  },
);

export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });

export const getProfile = () => api.get('/waiter-panel/profile');
export const getTables = () => api.get('/waiter-panel/tables');
export const getOrders = (mine?: boolean) =>
  api.get('/waiter-panel/orders', { params: mine ? { mine: 'true' } : {} });
export const getMenu = () => api.get('/waiter-panel/menu');
export const getStats = () => api.get('/waiter-panel/stats');

export const createOrder = (data: any) => api.post('/waiter-panel/orders', data);
export const advanceOrder = (id: string) => api.put(`/waiter-panel/orders/${id}/advance`);
export const finalizeOrder = (id: string, paymentMethod: string) =>
  api.put(`/waiter-panel/orders/${id}/finalize`, { paymentMethod });

export default api;
