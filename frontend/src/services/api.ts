// Central API service - handles all backend communication
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://marylandvendngbcknd-production.up.railway.app/api/v1";

// ─── Token Management ──────────────────────────────────────────────────────────
// Zustand persist stores data as: { state: { user, token, ... }, version: 0 }
export const getToken = (): string | null => {
  try {
    return localStorage.getItem("vendroute_token") || null;
  } catch {
    return null;
  }
};

export const setToken = (token: string): void => {
  try {
    localStorage.setItem("vendroute_token", token);
  } catch { }
};

export const clearToken = (): void => {
  try {
    localStorage.removeItem("vendroute_token");
    localStorage.removeItem("vendroute-auth");
  } catch { }
};

// ─── Core Fetch Wrapper ────────────────────────────────────────────────────────
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(errorData.message || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Auth APIs ─────────────────────────────────────────────────────────────────
export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar: string | null;
  };
}

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () =>
    apiFetch<{ success: boolean; data: any }>("/auth/me"),

  forgotPassword: (email: string) =>
    apiFetch<{ success: boolean; message: string; otp?: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  verifyOtp: (email: string, otp: string) =>
    apiFetch<{ success: boolean; message: string }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),

  resetPassword: (email: string, otp: string, newPassword: string) =>
    apiFetch<{ success: boolean; message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, otp, newPassword }),
    }),
};

// ─── Customers APIs ────────────────────────────────────────────────────────────
export const customersApi = {
  getAll: () => apiFetch<{ success: boolean; data: any[] }>("/customers"),
  getById: (id: string) => apiFetch<{ success: boolean; data: any }>(`/customers/${id}`),
  create: (data: any) =>
    apiFetch<{ success: boolean; data: any }>("/customers", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    apiFetch<{ success: boolean; data: any }>(`/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiFetch<{ success: boolean; message: string }>(`/customers/${id}`, {
      method: "DELETE",
    }),
};

export const stopsApi = {
  getAll: () => apiFetch<{ success: boolean; data: any[] }>("/stops"),
  checkIn: (id: string, data: any) =>
    apiFetch<{ success: boolean; data: any }>(`/stops/${id}/checkin`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// ─── Locations APIs ────────────────────────────────────────────────────────────
export const locationsApi = {
  getAll: () => apiFetch<{ success: boolean; data: any[] }>("/locations"),
  getById: (id: string) => apiFetch<{ success: boolean; data: any }>(`/locations/${id}`),
  create: (data: any) =>
    apiFetch<{ success: boolean; data: any }>("/locations", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    apiFetch<{ success: boolean; data: any }>(`/locations/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiFetch<{ success: boolean; message: string }>(`/locations/${id}`, {
      method: "DELETE",
    }),
};

// ─── Machines APIs ─────────────────────────────────────────────────────────────
export const machinesApi = {
  getAll: () => apiFetch<{ success: boolean; data: any[] }>("/machines"),
  getById: (id: string) => apiFetch<{ success: boolean; data: any }>(`/machines/${id}`),
  create: (data: any) =>
    apiFetch<{ success: boolean; data: any }>("/machines", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    apiFetch<{ success: boolean; data: any }>(`/machines/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiFetch<{ success: boolean; message: string }>(`/machines/${id}`, {
      method: "DELETE",
    }),
};

// ─── Routes APIs ───────────────────────────────────────────────────────────────
export const routesApi = {
  getAll: () => apiFetch<{ success: boolean; data: any[] }>("/routes"),
  getById: (id: string) => apiFetch<{ success: boolean; data: any }>(`/routes/${id}`),
  create: (data: any) =>
    apiFetch<{ success: boolean; data: any }>("/routes", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    apiFetch<{ success: boolean; data: any }>(`/routes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiFetch<{ success: boolean; message: string }>(`/routes/${id}`, {
      method: "DELETE",
    }),
  updateStopStatus: (stopId: string, status: string, routeName?: string, locationName?: string) =>
    apiFetch<{ success: boolean; data: any }>(`/routes/stops/${stopId}`, {
      method: "PATCH",
      body: JSON.stringify({ status, routeName, locationName }),
    }),
};

// ─── Users APIs ────────────────────────────────────────────────────────────────
export const usersApi = {
  getAll: (role?: string) =>
    apiFetch<{ success: boolean; data: any[] }>(
      role ? `/users?role=${role}` : "/users"
    ),
  getById: (id: string) => apiFetch<{ success: boolean; data: any }>(`/users/${id}`),
  create: (data: any) =>
    apiFetch<{ success: boolean; data: any }>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    apiFetch<{ success: boolean; data: any }>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiFetch<{ success: boolean; message: string }>(`/users/${id}`, {
      method: "DELETE",
    }),
};

// ─── Vehicles APIs ─────────────────────────────────────────────────────────────
export const vehiclesApi = {
  getAll: () => apiFetch<{ success: boolean; data: any[] }>("/vehicles"),
  getById: (id: string) => apiFetch<{ success: boolean; data: any }>(`/vehicles/${id}`),
  create: (data: any) =>
    apiFetch<{ success: boolean; data: any }>("/vehicles", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    apiFetch<{ success: boolean; data: any }>(`/vehicles/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiFetch<{ success: boolean; message: string }>(`/vehicles/${id}`, {
      method: "DELETE",
    }),
};

// ─── Reports APIs ──────────────────────────────────────────────────────────────
export const reportsApi = {
  getDashboard: () =>
    apiFetch<{ success: boolean; data: any }>("/reports/dashboard"),
};

// ─── Notifications APIs ────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: () =>
    apiFetch<{ success: boolean; data: any[] }>("/notifications"),
  getUnreadCount: () =>
    apiFetch<{ success: boolean; data: { count: number } }>("/notifications/unread-count"),
  markRead: (id: string) =>
    apiFetch<{ success: boolean; data: any }>(`/notifications/${id}/read`, {
      method: "PATCH",
    }),
  markAllRead: () =>
    apiFetch<{ success: boolean; message: string }>("/notifications/mark-all-read", {
      method: "PATCH",
    }),
};

// ─── Settings APIs ─────────────────────────────────────────────────────────────
export const settingsApi = {
  get: () =>
    apiFetch<{ success: boolean; data: any }>("/settings"),
  save: (data: any) =>
    apiFetch<{ success: boolean; data: any }>("/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

