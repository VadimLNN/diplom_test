import { useState, useEffect } from "react";
import axios from "axios";

function Projects() {
    const [projects, setProjects] = useState([]);
    const [message, setMessage] = useState("");

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get("http://localhost:5000/projects", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setProjects(response.data);
            } catch (error) {
                setMessage("Failed to load projects");
            }
        };
        fetchProjects();
    }, []);

    return (
        <div className="card">
            <h2>My Projects</h2>
            {message && <p className="message error">{message}</p>}
            {projects.length === 0 && !message ? (
                <p>No projects found.</p>
            ) : (
                <ul className="project-list">
                    {projects.map((project) => (
                        <li key={project.id} className="project-item">
                            <h3>{project.name}</h3>
                            <p>{project.description}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default Projects;
