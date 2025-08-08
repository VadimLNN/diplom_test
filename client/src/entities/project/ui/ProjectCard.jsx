// src/entities/project/ui/ProjectCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../../shared/ui/Card/Card"; // Наша стеклянная карточка
import styles from "./ProjectCard.module.css";

const ProjectCard = ({ project }) => {
    const navigate = useNavigate();

    const handleOpenProject = () => {
        navigate(`/projects/${project.id}`);
    };

    return (
        <Card className={styles.projectCard}>
            <h3 className={styles.title}>{project.name}</h3>
            <p className={styles.description}>{project.description || "No description provided."}</p>
            <div className={styles.footer}>
                <span className={styles.date}>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                <button onClick={handleOpenProject} className={styles.openButton}>
                    Open
                </button>
            </div>
        </Card>
    );
};

export default ProjectCard;
