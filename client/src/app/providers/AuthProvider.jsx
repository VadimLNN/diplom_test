// src/app/providers/AuthProvider.jsx

import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from "react";
import { jwtDecode } from "jwt-decode"; // Популярная, легкая библиотека для декодирования токена
import api from "../../shared/api/axios";

// 1. Создаем контекст
const AuthContext = createContext(null);

// 2. Функция для получения токена (чтобы не дублировать код)
const getStoredToken = () => {
    try {
        const token = localStorage.getItem("token");
        if (token) {
            // Простая проверка на срок годности токена
            const decoded = jwtDecode(token);
            if (decoded.exp * 1000 > Date.now()) {
                return token;
            }
        }
        localStorage.removeItem("token"); // Удаляем просроченный токен
        return null;
    } catch (error) {
        return null;
    }
};

// 3. Сам компонент-провайдер
export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(getStoredToken);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Состояние для первоначальной загрузки

    // Эффект для инициализации. Запускается ОДИН раз при старте приложения.
    useEffect(() => {
        const initialize = async () => {
            if (token) {
                try {
                    // Запрашиваем полные данные пользователя только при старте
                    const response = await api.get("/auth/user");
                    setUser(response.data);
                } catch (error) {
                    // Если токен есть, но невалиден (например, пользователь удален)
                    console.error("Auth initialization failed:", error);
                    setToken(null);
                    localStorage.removeItem("token");
                }
            }
            setLoading(false);
        };
        initialize();
    }, []); // <-- Пустой массив зависимостей!

    // Функция входа. Обернута в useCallback для стабильности.
    const login = useCallback(async (credentials) => {
        try {
            const response = await api.post("/auth/login", credentials);
            const newToken = response.data.token;

            // Декодируем токен, чтобы сразу получить базовые данные пользователя
            const decodedUser = jwtDecode(newToken);

            // Обновляем все состояния
            localStorage.setItem("token", newToken);
            setToken(newToken);
            setUser({ id: decodedUser.id, username: decodedUser.username }); // Устанавливаем юзера из токена

            return true; // Возвращаем успех
        } catch (error) {
            console.error("Login failed:", error);
            throw error; // Перебрасываем ошибку для обработки в форме
        }
    }, []);

    // Функция выхода
    const logout = useCallback(() => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
    }, []);

    // Используем useMemo, чтобы объект value не пересоздавался при каждом рендере
    const contextValue = useMemo(
        () => ({
            token,
            user,
            loading,
            login,
            logout,
        }),
        [token, user, loading, login, logout]
    );

    return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

// 4. Кастомный хук для использования контекста
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
