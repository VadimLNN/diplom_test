// src/pages/ProjectsDashboardPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import api from "../shared/api/axios";
import ProjectGrid from "../widgets/ProjectGrid/ui/ProjectGrid";
import styles from "./PageStyles.module.css";
import CreateProjectForm from "../features/projects/create/ui/CreateProjectForm";
import Modal from "../shared/ui/Modal/Modal";
import toast from "react-hot-toast";

const ProjectsDashboardPage = () => {
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchProjects = useCallback(async () => {
        try {
            setIsLoading(true);
            setError("");
            const response = await api.get("/projects");

            // ✅ ФИЛЬТРУЕМ удалённые/битые проекты
            const validProjects = response.data.filter((project) => project.id && project.name && !project.deleted_at);

            setProjects(validProjects);
        } catch (err) {
            setError("Failed to fetch projects.");
            toast.error("Failed to load projects");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const handleProjectCreated = useCallback((newProject) => {
        setProjects((prev) => [newProject, ...prev]);
        setIsModalOpen(false);
        toast.success("Project created!");
    }, []);

    const handleOpenCreateModal = () => {
        setIsModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className={styles.pageContainer}>
                <p>Loading projects...</p>
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            <div className={styles.pageHeader}>
                <h1>My Projects</h1>
            </div>

            {error && <p style={{ color: "red" }}>{error}</p>}

            <ProjectGrid
                projects={projects}
                onCreateClick={handleOpenCreateModal}
                onRefresh={fetchProjects} // ✅ Для очистки состояния
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Project">
                <CreateProjectForm onSuccess={handleProjectCreated} />
            </Modal>
        </div>
    );
};

export default ProjectsDashboardPage;
