const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export async function apiRequest<T = any>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: any,
  customHeaders: Record<string, string> = {}
): Promise<T> {
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

export const api = {
  get: <T = any>(endpoint: string) => apiRequest<T>(endpoint, 'GET'),
  post: <T = any>(endpoint: string, body: any) => apiRequest<T>(endpoint, 'POST', body),
  put: <T = any>(endpoint: string, body: any) => apiRequest<T>(endpoint, 'PUT', body),
  patch: <T = any>(endpoint: string, body: any) => apiRequest<T>(endpoint, 'PATCH', body),
  delete: <T = any>(endpoint: string) => apiRequest<T>(endpoint, 'DELETE'),
};
