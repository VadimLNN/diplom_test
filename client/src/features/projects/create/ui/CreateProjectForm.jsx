import React, { useState } from "react";
import api from "../../../../shared/api/axios";
import formStyles from "./CreateProjectForm.module.css"; // Переиспользуем стили

const CreateProjectForm = ({ onSuccess }) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post("/projects", { name, description });
            onSuccess(response.data); // Вызываем коллбэк при успехе
        } catch (err) {
            setError(err.response?.data?.error || "Failed to create project");
        }
    };

    return (
        <form onSubmit={handleSubmit} className={formStyles.formContainer}>
            <input
                className={`${formStyles.formField} ${formStyles.inputPill}`}
                type="text"
                placeholder="Project Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
            />
            <textarea
                className={`${formStyles.formField} ${formStyles.textareaField}`}
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="4"
                style={{ height: "auto" }}
            />
            <button type="submit" className={`${formStyles.button} ${formStyles.primaryButton}`}>
                Create
            </button>
            {error && <p style={{ color: "red" }}>{error}</p>}
        </form>
    );
};

export default CreateProjectForm;
