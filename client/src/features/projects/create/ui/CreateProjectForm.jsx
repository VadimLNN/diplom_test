import React, { useState, useEffect, useRef } from "react";
import api from "../../../../shared/api/axios";
import formStyles from "./CreateProjectForm.module.css";
import toast from "react-hot-toast";

const CreateProjectForm = ({ onSuccess, isOpen }) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const nameInputRef = useRef(null);

    useEffect(() => {
        if (isOpen && nameInputRef.current) {
            setTimeout(() => {
                nameInputRef.current.focus();
            }, 100);
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post("/projects", { name, description });
            toast.success("Project created successfully!");
            onSuccess(response.data); // Вызываем коллбэк для родителя
        } catch (err) {
            const errorMessage = err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || "Failed to create project";
            toast.error(errorMessage);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={formStyles.formContainer}>
            <input
                ref={nameInputRef}
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
        </form>
    );
};

export default CreateProjectForm;
