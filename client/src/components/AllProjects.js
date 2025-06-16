import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";

function AllProjects() {
    const [projects, setProjects] = useState([]);
    const [message, setMessage] = useState("");
    const navigate = useNavigate();
    const socket = io("http://localhost:5000", { withCredentials: true });

    useEffect(() => {
        fetchProjects();

        socket.on("connect", () => {
            console.log("Socket connected:", socket.id);
        });

        socket.on("projectUpdated", (updatedProject) => {
            setProjects((prev) => prev.map((project) => (project.id === updatedProject.id ? updatedProject : project)));
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const fetchProjects = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setMessage("No authentication token found");
                return;
            }
            const response = await axios.get("http://localhost:5000/projects/all", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setProjects(response.data);
        } catch (error) {
            console.error("Fetch projects error:", error.response?.data || error.message);
            setMessage(error.response?.data?.error || "Failed to load projects.");
        }
    };

    const handleProjectClick = (projectId) => {
        navigate(`/projects/${projectId}`);
    };

    return (
        <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
            <h2 style={{ color: "#333" }}>All Projects</h2>
            {message && <p style={{ color: message.includes("success") ? "green" : "red", marginBottom: "10px" }}>{message}</p>}
            <div>
                {projects.length === 0 ? (
                    <p style={{ color: "#666" }}>No projects found.</p>
                ) : (
                    <ul style={{ listStyleType: "none", padding: 0 }}>
                        {projects.map((project) => (
                            <li
                                key={project.id}
                                style={{ margin: "10px 0", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", background: "#f9f9f9" }}
                            >
                                <span
                                    onClick={() => handleProjectClick(project.id)}
                                    style={{ cursor: "pointer", color: "#007bff", textDecoration: "underline" }}
                                >
                                    {project.name || "Untitled Project"}
                                </span>
                                <span style={{ marginLeft: "10px", color: "#666", fontSize: "0.9em" }}>ID: {project.id}</span>
                                <span style={{ marginLeft: "10px", color: "#666", fontSize: "0.9em" }}>Owner: {project.owner_id}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default AllProjects;
