import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

export const loginUser = (data: { email: string; password: string }) =>
  api.post('/auth/login', data);

export const registerUser = (data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  cpfCnpj?: string;
}) => api.post('/auth/register', { ...data, role: 'CLIENT' });

export default api;
