// src/shared/api/socket.js
import { io } from "socket.io-client";

const URL = "http://localhost:5000"; // Адрес вашего бэкенда
export const socket = io(URL, {
    autoConnect: false, // Мы будем подключаться вручную, когда откроем документ
});
