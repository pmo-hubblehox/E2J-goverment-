import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'https://education-to-job-api.hubblehox.ai/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('e2j_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Only force-logout when a token exists and the server rejects it (expired/invalid).
    // Do NOT redirect on login/register 401s (wrong password, etc.) — those pages handle their own errors.
    const isAuthEndpoint = err.config?.url?.includes('/auth/');
    if (err.response?.status === 401 && !isAuthEndpoint && localStorage.getItem('e2j_token')) {
      localStorage.removeItem('e2j_token');
      localStorage.removeItem('e2j_user');
      window.location.href = '/login/student';
    }
    return Promise.reject(err);
  }
);

export default api;
