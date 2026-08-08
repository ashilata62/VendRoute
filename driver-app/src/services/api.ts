import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Production backend URL (Railway deployed) — works on real devices & emulators
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://marylandvendngbcknd-production.up.railway.app/api/v1';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
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
  checkIn: (stopId: string, location: any) => api.post(`/stops/${stopId}/check-in`, location),
  completeService: async (stopId: string, data: any) => {
    const isOnline = useAuthStore.getState().isOnline;
    if (!isOnline) {
      const { addToSyncQueue } = await import('./syncManager');
      await addToSyncQueue({ type: 'route_stop_complete', data: { routeStopId: stopId, ...data } });
      return { data: { success: true, message: 'Saved offline' } };
    }
    return api.put(`/stops/${stopId}/checkin`, data);
  },
};

export const routesApi = {
  updateStopStatus: (stopId: string, status: string, routeName?: string, locationName?: string) =>
    api.patch(`/routes/stops/${stopId}`, { status, routeName, locationName }),
};

export const authApi = {
  punchIn: () => api.post('/attendance/punch-in'),
  punchOut: () => api.post('/attendance/punch-out'),
  getHistory: () => api.get('/attendance/history'),
  updateStatus: (userId: string, isOnline: boolean) => api.put(`/users/${userId}`, { isOnline }),
};

export default api;
