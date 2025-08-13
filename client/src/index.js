// src/index.js

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App"; // 1. Импортируем ваш главный компонент App

// 2. Импортируем глобальные стили, чтобы они применились ко всему приложению
import "./app/styles/index.css";

// 3. Находим корневой HTML-элемент в public/index.html
const container = document.getElementById("root");

// 4. Создаем "корень" React-приложения
const root = createRoot(container);

// 5. "Рендерим" (отрисовываем) ваш компонент <App /> внутри этого элемента
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
