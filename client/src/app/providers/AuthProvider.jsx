import React, { createContext, useState, useEffect, useContext } from "react";
import api from "../../shared/api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            if (token) {
                try {
                    const response = await api.get("/auth/user"); // Токен добавляется интерцептором
                    setUser(response.data);
                } catch (error) {
                    console.error("Auth initialization error:", error);
                    logout();
                }
            }
            setLoading(false);
        };
        initializeAuth();
    }, [token]);

    const login = async (credentials) => {
        try {
            const response = await api.post("/auth/login", credentials);
            const newToken = response.data.token;
            setToken(newToken);
            localStorage.setItem("token", newToken);
            const userResponse = await api.get("/auth/user");
            setUser(userResponse.data);
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("token");
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return <AuthContext.Provider value={{ user, token, login, logout, setUser }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
