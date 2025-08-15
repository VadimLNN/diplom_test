// src/pages/ProjectsDashboardPage.jsx
import React, { useState, useEffect } from "react";
import api from "./../shared/api/axios";
import ProjectGrid from "./../widgets/ProjectGrid/ui/ProjectGrid";
import styles from "./PageStyles.module.css";
import CreateProjectForm from "../features/projects/create/ui/CreateProjectForm";
import Modal from "../shared/ui/Modal/Modal";

const ProjectsDashboardPage = () => {
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setIsLoading(true);
                const response = await api.get("/projects");
                setProjects(response.data);
            } catch (err) {
                setError("Failed to fetch projects.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProjects();
    }, []);

    const handleProjectCreated = (newProject) => {
        setProjects((prevProjects) => [newProject, ...prevProjects]);
        setIsModalOpen(false);
    };

    const handleOpenCreateModal = () => {
        setIsModalOpen(true);
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.pageHeader}>
                <h1>My Projects</h1>
                <button onClick={handleOpenCreateModal} className="btn-primary" style={{ margin: "0 auto 1rem" }}>
                    + New Project
                </button>
            </div>

            {isLoading && <p>Loading projects...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            {!isLoading && !error && <ProjectGrid projects={projects} />}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create a New Project">
                <CreateProjectForm onSuccess={handleProjectCreated} isOpen={isModalOpen} />
            </Modal>
        </div>
    );
};

export default ProjectsDashboardPage;
