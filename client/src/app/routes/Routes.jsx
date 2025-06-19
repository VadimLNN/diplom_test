import React from "react";
import { Routes as ReactRoutes, Route } from "react-router-dom";
import Login from "../../features/auth/Login";
import Register from "../../features/auth/Register";
import Projects from "../../features/projects/List";
import ProjectPage from "../../features/projects/ProjectPage";

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
