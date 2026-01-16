// src/app/routes/index.jsx

import React from "react";
import { Routes as ReactRoutes, Route } from "react-router-dom";

// 1. Импортируем наш "стражник"
import PrivateRoute from "./PrivateRoute";

// 2. Импортируем все СТРАНИЦЫ (из папки /pages)
import LandingPage from "../../pages/LandingPage";
import LoginPage from "../../pages/LoginPage";
import RegisterPage from "../../pages/RegisterPage";
import ProjectsDashboardPage from "../../pages/ProjectsDashboardPage";
import ProjectDetailPage from "../../pages/ProjectDetailPage";
import DocumentEditorPage from "../../pages/DocumentEditorPage";
import SettingsPage from "../../pages/SettingsPage";
// Можно создать компонент для страницы 404
// import NotFoundPage from '../../pages/NotFoundPage';

const AppRoutes = () => (
    <ReactRoutes>
        {/* --- Публичные роуты --- */}
        {/* Главная страница для неавторизованных пользователей */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* --- Приватные роуты (защищенные) --- */}
        {/* Главная панель после входа */}
        <Route
            path="/projects"
            element={
                <PrivateRoute>
                    <ProjectsDashboardPage />
                </PrivateRoute>
            }
        />
        {/* Страница конкретного проекта */}
        <Route
            path="/projects/:projectId"
            element={
                <PrivateRoute>
                    <ProjectDetailPage />
                </PrivateRoute>
            }
        />
        {/* Страница редактора документа */}
        <Route
            path="/projects/:projectId/tabs/:tabId"
            element={
                <PrivateRoute>
                    <DocumentEditorPage />
                </PrivateRoute>
            }
        />
        {/* Страница настроек пользователя */}
        <Route
            path="/settings"
            element={
                <PrivateRoute>
                    <SettingsPage />
                </PrivateRoute>
            }
        />

        {/* Роут "404 Not Found" - срабатывает, если ни один другой не подошел */}
        <Route path="*" element={<div>404 - Страница не найдена</div>} />
    </ReactRoutes>
);

export default AppRoutes;
