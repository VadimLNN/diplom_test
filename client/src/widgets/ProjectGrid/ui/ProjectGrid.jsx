// src/widgets/ProjectGrid/ui/ProjectGrid.jsx
import React from "react";
import ProjectCard from "../../../entities/project/ui/ProjectCard";
import styles from "./ProjectGrid.module.css";

const ProjectGrid = ({ projects }) => {
    if (!projects || projects.length === 0) {
        return <p>No projects found. Create your first one!</p>;
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
