import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Production backend URL
const API_URL = 'https://marylandvendngbcknd-production.up.railway.app/api/v1';

const api = axios.create({
  baseURL: API_URL,
});

// Automatically attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const stopsApi = {
  getDriverStops: () => api.get('/stops'),
  getDriverRoutes: (driverId: string) => api.get(`/routes?driverId=${driverId}`),
  checkIn: (stopId: string, location: any) => api.post(`/stops/${stopId}/check-in`, location), // Deprecated?
  completeService: (stopId: string, data: any) => api.put(`/stops/${stopId}/checkin`, data),
};

export default api;
