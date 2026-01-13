// src/features/projects/create/ui/CreateProjectForm.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../../../../shared/api/axios";
import formStyles from "./CreateProjectForm.module.css";
import toast from "react-hot-toast";

const CreateProjectForm = ({ onSuccess, isOpen }) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const nameInputRef = useRef(null);

    // ✅ Фокус при открытии модалки
    useEffect(() => {
        if (isOpen && nameInputRef.current) {
            setTimeout(() => {
                nameInputRef.current?.focus();
            }, 100);
        }
        // ✅ Сброс формы при закрытии
        if (!isOpen) {
            setName("");
            setDescription("");
            setIsLoading(false);
        }
    }, [isOpen]);

    // ✅ useCallback для стабильности
    const handleSubmit = useCallback(
        async (e) => {
            e.preventDefault();

            if (!name.trim()) {
                toast.error("Project name is required");
                return;
            }

            try {
                setIsLoading(true);
                const response = await api.post("/projects", {
                    name: name.trim(),
                    description: description.trim(),
                });

                toast.success("Project created successfully!");
                onSuccess(response.data);

                // ✅ Сброс формы после успеха
                setName("");
                setDescription("");
            } catch (err) {
                const errorMessage = err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || "Failed to create project";
                toast.error(errorMessage);
            } finally {
                setIsLoading(false);
            }
        },
        [name, description, onSuccess]
    );

    return (
        <form onSubmit={handleSubmit} className={formStyles.formContainer}>
            <input
                ref={nameInputRef}
                className={`${formStyles.formField} ${formStyles.inputPill}`}
                type="text"
                placeholder="Project Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required
            />

            <textarea
                className={`${formStyles.formField} ${formStyles.textareaField}`}
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="4"
                style={{ height: "auto" }}
                disabled={isLoading}
            />

            <button type="submit" className={`${formStyles.button} ${formStyles.primaryButton}`} disabled={isLoading || !name.trim()}>
                {isLoading ? "Creating..." : "Create"}
            </button>
        </form>
    );
};

export default CreateProjectForm;
