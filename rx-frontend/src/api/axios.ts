import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";


const api: AxiosInstance = axios.create({
  baseURL: (window as any)._env_.VITE_API_BASE,
  timeout: 10000,
  withCredentials: true,
});


// RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401 || status === 403) {
      // ✅ Only redirect if NOT already on login/register pages
      const currentPath = window.location.pathname;
      if (!['/login', '/register', '/forgot-password'].includes(currentPath)) {
        console.warn("Auth expired. Redirecting...");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
