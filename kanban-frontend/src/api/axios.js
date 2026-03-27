import axios from "axios";

const withTrailingSlash = (value) => (value.endsWith("/") ? value : `${value}/`);

const getApiBaseUrl = () => {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (configuredBaseUrl) {
    return withTrailingSlash(configuredBaseUrl);
  }

  if (import.meta.env.DEV) {
    return "http://127.0.0.1:8000/api/";
  }

  return "/api/";
};

const API_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const refreshToken = localStorage.getItem("refreshToken");

    // If unauthorized → try refresh
    if (
      error.response?.status === 401 &&
      refreshToken &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await axios.post(
          `${API_URL}auth/token/refresh/`,
          {
            refresh: refreshToken,
          }
        );

        const newAccessToken = refreshResponse.data.access;

        localStorage.setItem("token", newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        // ❌ Refresh failed → logout user
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");

        // Optional: redirect to login
        window.location.href = "/login";

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
