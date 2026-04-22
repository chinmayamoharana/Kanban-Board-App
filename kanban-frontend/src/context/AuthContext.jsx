import React, { createContext, useState, useEffect, useContext } from 'react';
import { authApi } from '../api/boardApi';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const applySession = (data) => {
        localStorage.setItem('token', data.access);
        localStorage.setItem('refreshToken', data.refresh);
        if (data.id && data.username && data.email) {
            setUser({
                id: data.id,
                username: data.username,
                email: data.email,
            });
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            authApi.getMe()
                .then(res => setUser(res.data))
                .catch(() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (credentials) => {
        const res = await authApi.login(credentials);
        applySession({
            access: res.data.access,
            refresh: res.data.refresh,
        });
        const userRes = await authApi.getMe();
        setUser(userRes.data);
    };

    const register = async (formData) => {
        const res = await authApi.register(formData);
        applySession(res.data);
        return res.data;
    };

    const updateProfile = async (profileData) => {
        await authApi.updateMe(profileData);
        const refreshedUser = await authApi.getMe();
        setUser(refreshedUser.data);
        return refreshedUser.data;
    };

    const changePassword = async (passwordData) => {
        return authApi.changePassword(passwordData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, updateProfile, changePassword, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
