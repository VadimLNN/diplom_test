import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../shared/api/axios";

const List = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [error, setError] = useState("");
    const [newProject, setNewProject] = useState({ name: "", description: "" });
    const [editProject, setEditProject] = useState(null);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await api.get("/projects");
                setProjects(response.data);
                setError("");
            } catch (error) {
                setError(error.response?.data?.error || "Failed to fetch projects");
            }
        };
        fetchProjects();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post("/projects", newProject);
            setProjects([...projects, response.data]);
            setNewProject({ name: "", description: "" });
            setError("");
        } catch (error) {
            setError(error.response?.data?.error || "Creation failed");
        }
    };

    const handleUpdate = async (id) => {
        try {
            const response = await api.put(`/projects/${id}`, editProject);
            setProjects(projects.map((p) => (p.id === id ? response.data : p)));
            setEditProject(null);
            setError("");
        } catch (error) {
            setError(error.response?.data?.error || "Update failed");
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/projects/${id}`);
            setProjects(projects.filter((p) => p.id !== id));
            setError("");
        } catch (error) {
            setError(error.response?.data?.error || "Deletion failed");
        }
    };

    const handleOpen = (projectId) => {
        navigate(`/projects/${projectId}`);
    };

    return (
        <div className="container">
            <h1>Projects Page</h1>
            {error && <div className="message error">{error}</div>}

            {/* Форма создания */}
            <div className="card">
                <h2>Create Project</h2>
                <form onSubmit={handleCreate} className="form">
                    <input
                        value={newProject.name}
                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                        placeholder="Name"
                        required
                    />
                    <input
                        value={newProject.description}
                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                        placeholder="Description"
                    />
                    <button type="submit" className="btn btn-primary">
                        Create
                    </button>
                </form>
            </div>

            {/* Список проектов */}
            <div className="project-grid">
                {projects.length === 0 ? (
                    <p>No projects yet</p>
                ) : (
                    projects.map((project) => (
                        <div key={project.id} className="card project-card">
                            {editProject && editProject.id === project.id ? (
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleUpdate(project.id);
                                    }}
                                    className="form"
                                >
                                    <input
                                        value={editProject.name}
                                        onChange={(e) => setEditProject({ ...editProject, name: e.target.value })}
                                        required
                                    />
                                    <input
                                        value={editProject.description}
                                        onChange={(e) => setEditProject({ ...editProject, description: e.target.value })}
                                    />
                                    <div className="project-actions">
                                        <button type="submit" className="btn btn-primary">
                                            Save
                                        </button>
                                        <button type="button" className="btn btn-secondary" onClick={() => setEditProject(null)}>
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div>
                                    <h3>{project.name}</h3>
                                    <p>{project.description}</p>
                                    <div className="project-actions">
                                        <button className="btn btn-secondary" onClick={() => setEditProject(project)}>
                                            Edit
                                        </button>
                                        <button className="btn btn-danger" onClick={() => handleDelete(project.id)}>
                                            Delete
                                        </button>
                                        <button className="btn btn-primary" onClick={() => handleOpen(project.id)}>
                                            Open
                                        </button>{" "}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default React.memo(List);
