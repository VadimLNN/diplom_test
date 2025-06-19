// src/shared/api/axios.js
import axios from "axios";

// Создаем инстанс axios с базовым URL
const api = axios.create({
    baseURL: "http://localhost:5000/api",
});

// Создаем перехватчик (interceptor) для всех исходящих запросов
api.interceptors.request.use(
    (config) => {
        // Получаем токен из localStorage перед каждым запросом
        const token = localStorage.getItem("token");

        // Если токен существует, добавляем его в заголовок Authorization
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        // Если при настройке запроса произошла ошибка, отклоняем Promise
        return Promise.reject(error);
    }
);

export default api;
