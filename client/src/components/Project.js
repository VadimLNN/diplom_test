import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";

function Project() {
    const { id } = useParams(); // projectId
    const [documents, setDocuments] = useState([]);
    const [message, setMessage] = useState("");
    const [newDoc, setNewDoc] = useState({ title: "" });
    const navigate = useNavigate();
    const socket = io("http://localhost:5000", { withCredentials: true });

    useEffect(() => {
        fetchDocuments();

        socket.on("connect", () => {
            console.log("Socket connected:", socket.id);
            socket.emit("joinProject", `project:${id}`);
        });

        socket.on("documentCreated", (newDocument) => {
            if (newDocument.project_id === parseInt(id)) {
                setDocuments((prev) => [...prev, newDocument]);
            }
        });

        socket.on("documentUpdated", (updatedDocument) => {
            if (updatedDocument.project_id === parseInt(id)) {
                setDocuments((prev) => prev.map((doc) => (doc.id === updatedDocument.id ? updatedDocument : doc)));
            }
        });

        socket.on("documentDeleted", (docId) => {
            setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
        });

        return () => {
            socket.disconnect();
        };
    }, [id]);

    const fetchDocuments = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setMessage("No authentication token found");
                return;
            }
            const response = await axios.get(`http://localhost:5000/projects/${id}/documents`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setDocuments(response.data);
        } catch (error) {
            console.error("Fetch documents error:", error.response?.data || error.message);
            setMessage(error.response?.data?.error || "Failed to load documents.");
        }
    };

    const handleCreateDocument = async (e) => {
        e.preventDefault();
        if (!newDoc.title.trim()) {
            setMessage("Title is required");
            return;
        }
        try {
            const token = localStorage.getItem("token");
            console.log("Sending request with body:", { title: newDoc.title }); // Отладка
            const response = await axios.post(
                `http://localhost:5000/projects/${id}/documents`,
                { title: newDoc.title }, // Только title
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setDocuments([...documents, response.data]);
            setNewDoc({ title: "" });
            setMessage("Document created successfully");
            socket.emit("documentCreated", response.data);
        } catch (error) {
            console.error("Create document error:", error.response?.data || error.message);
            setMessage(error.response?.data?.error || "Failed to create document");
        }
    };

    const handleDocumentClick = (docId) => {
        navigate(`/documents/${docId}`);
    };

    return (
        <div>
            <h2>Documents for Project {id}</h2> {/* Улучшенный заголовок */}
            <form onSubmit={handleCreateDocument} style={{ marginBottom: "20px" }}>
                <input
                    type="text"
                    placeholder="Document Title"
                    value={newDoc.title}
                    onChange={(e) => setNewDoc({ title: e.target.value })}
                    style={{ padding: "5px", marginRight: "10px" }}
                />
                <button type="submit" style={{ padding: "5px 10px" }}>
                    Create Document
                </button>
            </form>
            {message && <p style={{ color: "red" }}>{message}</p>}
            <div>
                {documents.length === 0 ? (
                    <p>No documents found.</p>
                ) : (
                    <ul style={{ listStyleType: "none", padding: 0 }}>
                        {documents.map((doc) => (
                            <li key={doc.id} style={{ margin: "10px 0", padding: "5px", border: "1px solid #ccc", borderRadius: "4px" }}>
                                <span onClick={() => handleDocumentClick(doc.id)} style={{ cursor: "pointer", color: "#007bff" }}>
                                    {doc.title || "Untitled"}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default Project;
