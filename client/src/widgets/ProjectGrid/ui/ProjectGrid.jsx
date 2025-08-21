// src/widgets/ProjectGrid/ui/ProjectGrid.jsx
import React from "react";
import ProjectCard from "../../../entities/project/ui/ProjectCard";
import styles from "./ProjectGrid.module.css";
import EmptyState from "../../../shared/ui/EmptyState/EmptyState";

const ProjectGrid = ({ projects, onCreateClick }) => {
    if (!projects || projects.length === 0) {
        return (
            <EmptyState icon="🗂️" title="No Projects Yet" message="It looks a bit empty here. Let's create your first project to get started!">
                <button onClick={onCreateClick} className="btn-primary">
                    + Create Your First Project
                </button>
            </EmptyState>
        );
    }

    return (
        <div className={styles.grid}>
            {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
            ))}
        </div>
    );
};

export default ProjectGrid;
