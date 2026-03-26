import axios from 'axios';

const getApiBaseUrl = () => {
    const configuredUrl = import.meta.env.VITE_API_URL?.trim();
    if (configuredUrl) {
        return `${configuredUrl.replace(/\/+$/, '')}/`;
    }

    if (import.meta.env.DEV) {
        return 'http://127.0.0.1:8000/api/';
    }

    return '/api/';
};

const API_URL = getApiBaseUrl();

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const refreshToken = localStorage.getItem('refreshToken');

        if (error.response?.status === 401 && refreshToken && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshResponse = await axios.post(`${API_URL}auth/token/refresh/`, {
                    refresh: refreshToken,
                });

                localStorage.setItem('token', refreshResponse.data.access);
                originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.access}`;

                return api(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
