import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import ProjectCard from "./ProjectCard";
import CreateProjectForm from "./CreateProjectForm";

function Projects() {
    const [projects, setProjects] = useState([]);
    const [message, setMessage] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("http://localhost:5000/projects", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setProjects(response.data);
            localStorage.setItem("cachedProjects", JSON.stringify(response.data));
        } catch (error) {
            console.error("Fetch projects error:", error);
            setMessage(error.response?.data?.error || "Failed to load projects");
            const cachedProjects = JSON.parse(localStorage.getItem("cachedProjects")) || [];
            setProjects(cachedProjects);
        }
    };

    const handleCreateOrUpdate = async (projectData) => {
        try {
            const token = localStorage.getItem("token");
            let response;
            if (editingProject) {
                response = await axios.put(`http://localhost:5000/projects/${editingProject.id}`, projectData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setMessage("Project updated successfully");
            } else {
                response = await axios.post("http://localhost:5000/projects", projectData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setMessage("Project created successfully");
            }
            setProjects((prev) => (editingProject ? prev.map((p) => (p.id === response.data.id ? response.data : p)) : [...prev, response.data]));
            setIsModalOpen(false);
            setEditingProject(null);
        } catch (error) {
            console.error("Create/Update project error:", error);
            setMessage(error.response?.data?.error || "Failed to save project");
        }
    };

    const handleDelete = async (id) => {
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`http://localhost:5000/projects/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setProjects(projects.filter((p) => p.id !== id));
            setMessage("Project deleted successfully");
        } catch (error) {
            console.error("Delete project error:", error);
            setMessage(error.response?.data?.error || "Failed to delete project");
        }
    };

    return (
        <div className="container">
            <h2>Projects</h2>
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                Create Project
            </button>
            {message && <p className={`message ${message.includes("successfully") ? "success" : "error"}`}>{message}</p>}
            <div className="project-grid">
                {projects.map((project) => (
                    <ProjectCard
                        key={project.id}
                        project={project}
                        onEdit={() => {
                            setEditingProject(project);
                            setIsModalOpen(true);
                        }}
                        onDelete={() => handleDelete(project.id)}
                    />
                ))}
            </div>
            {isModalOpen && (
                <CreateProjectForm
                    onSubmit={handleCreateOrUpdate}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingProject(null);
                    }}
                    initialData={editingProject}
                />
            )}
        </div>
    );
}

export default Projects;
