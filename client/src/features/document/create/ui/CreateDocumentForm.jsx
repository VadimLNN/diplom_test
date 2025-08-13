import React, { useState } from "react";
import api from "../../../../shared/api/axios";
import formStyles from "../../../auth/ui/Form.module.css"; // Переиспользуем стили

const CreateDocumentForm = ({ projectId, onSuccess }) => {
    const [title, setTitle] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post(`/documents/project/${projectId}`, { title, content: "" });
            onSuccess(response.data);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to create document");
        }
    };

    return (
        <form onSubmit={handleSubmit} className={formStyles.formContainer}>
            <input
                className={formStyles.input}
                type="text"
                placeholder="Document Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
            />
            <button type="submit" className={`${formStyles.button} ${formStyles.primaryButton}`}>
                Create Document
            </button>
            {error && <p style={{ color: "red" }}>{error}</p>}
        </form>
    );
};

export default CreateDocumentForm;
