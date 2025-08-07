import React from "react";
import { Routes as ReactRoutes, Route } from "react-router-dom";
import Login from "../../features/auth/ui/LoginForm";
import Register from "../../features/auth/ui/RegisterForm";
import Projects from "../../pages/ProjectDetailPage";
import ProjectPage from "../../pages/ProjectsPage";

const AppRoutes = () => (
    <ReactRoutes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:projectId" element={<ProjectPage />} />
        <Route path="/" element={<Login />} />
    </ReactRoutes>
);

export default AppRoutes;
