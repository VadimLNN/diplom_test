// src/app/routes/index.jsx
import React from "react";
import { Routes as ReactRoutes, Route } from "react-router-dom";
import PrivateRoute from "./PrivateRoute"; // Ваш компонент для защиты роутов

// Импортируем все наши новые страницы
import LandingPage from "../../pages/LandingPage";
import LoginPage from "../../pages/LoginPage";
import RegisterPage from "../../pages/RegisterPage";
import ProjectsDashboardPage from "../../pages/ProjectsDashboardPage";
import ProjectDetailPage from "../../pages/ProjectDetailPage";
import DocumentEditorPage from "../../pages/DocumentEditorPage";
import SettingsPage from "../../pages/SettingsPage";

const AppRoutes = () => (
    <ReactRoutes>
        {/* --- Публичные роуты --- */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* --- Приватные роуты, защищенные PrivateRoute --- */}
        <Route
            path="/projects"
            element={
                <PrivateRoute>
                    <ProjectsDashboardPage />
                </PrivateRoute>
            }
        />
        <Route
            path="/projects/:projectId"
            element={
                <PrivateRoute>
                    <ProjectDetailPage />
                </PrivateRoute>
            }
        />
        <Route
            path="/documents/:documentId"
            element={
                <PrivateRoute>
                    <DocumentEditorPage />
                </PrivateRoute>
            }
        />
        <Route
            path="/settings"
            element={
                <PrivateRoute>
                    <SettingsPage />
                </PrivateRoute>
            }
        />

        {/* Можно добавить страницу 404 Not Found */}
        <Route path="*" element={<div>Страница не найдена</div>} />
    </ReactRoutes>
);

export default AppRoutes;
