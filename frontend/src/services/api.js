import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('campusflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Unauthorized/Expired Token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('campusflow_token');
      localStorage.removeItem('campusflow_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const BACKEND_URL = 'http://127.0.0.1:8000';
export const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'><circle cx='64' cy='64' r='64' fill='%23334155'/><circle cx='64' cy='46' r='22' fill='%23cbd5e1'/><path d='M22 108c0-23.196 18.804-42 42-42s42 18.804 42 42a63.8 63.8 0 0 1-84 0z' fill='%23cbd5e1'/></svg>";

export const getAvatarUrl = (avatarUrl) => {
  if (!avatarUrl || avatarUrl === 'null' || avatarUrl === 'undefined' || avatarUrl === 'default') {
    return DEFAULT_AVATAR;
  }
  if (
    avatarUrl.startsWith('http://') ||
    avatarUrl.startsWith('https://') ||
    avatarUrl.startsWith('data:') ||
    avatarUrl.startsWith('blob:')
  ) {
    return avatarUrl;
  }
  const cleanPath = avatarUrl.startsWith('/') ? avatarUrl : `/${avatarUrl}`;
  return `${BACKEND_URL}${cleanPath}`;
};

export default api;
