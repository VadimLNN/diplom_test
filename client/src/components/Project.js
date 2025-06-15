import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import DocumentCard from "./DocumentCard";

function Project() {
    const { id } = useParams();
    const [documents, setDocuments] = useState([]);
    const [message, setMessage] = useState("");
    const [title, setTitle] = useState("");

    useEffect(() => {
        fetchDocuments();
    }, [id]);

    const fetchDocuments = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`http://localhost:5000/projects/${id}/documents`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setDocuments(response.data);
            localStorage.setItem(`cachedDocuments_${id}`, JSON.stringify(response.data));
        } catch (error) {
            console.error("Fetch documents error:", error);
            setMessage(error.response?.data?.error || "Failed to load documents");
            const cachedDocuments = JSON.parse(localStorage.getItem(`cachedDocuments_${id}`)) || [];
            setDocuments(cachedDocuments);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            setMessage("Title is required");
            return;
        }
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                `http://localhost:5000/projects/${id}/documents`,
                { title },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setDocuments([...documents, response.data]);
            setTitle("");
            setMessage("Document created successfully");
        } catch (error) {
            console.error("Create document error:", error);
            setMessage(error.response?.data?.error || "Failed to create document");
        }
    };

    const handleDelete = async (docId) => {
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`http://localhost:5000/documents/${docId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setDocuments(documents.filter((doc) => doc.id !== docId));
            setMessage("Document deleted successfully");
        } catch (error) {
            console.error("Delete document error:", error);
            setMessage(error.response?.data?.error || "Failed to delete document");
        }
    };

    return (
        <div className="container">
            <h2>Documents</h2>
            <form onSubmit={handleCreate} className="form">
                <input type="text" placeholder="Document Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                <button type="submit" className="btn btn-primary">
                    Create Document
                </button>
            </form>
            {message && <p className={`message ${message.includes("successfully") ? "success" : "error"}`}>{message}</p>}
            <div className="document-grid">
                {documents.map((doc) => (
                    <DocumentCard key={doc.id} document={doc} onDelete={() => handleDelete(doc.id)} />
                ))}
            </div>
        </div>
    );
}

export default Project;
