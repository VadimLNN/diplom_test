// src/features/tabs/create/ui/CreateTabForm.jsx
import React, { useState, useEffect, useRef } from "react";
import api from "../../../../shared/api/axios";
import formStyles from "../../../auth/ui/Form.module.css";
import toast from "react-hot-toast";

const CreateTabForm = ({ projectId, onSuccess, isOpen }) => {
    const [title, setTitle] = useState("");
    const [tabType, setTabType] = useState("text");
    const titleInputRef = useRef(null);

    useEffect(() => {
        if (isOpen && titleInputRef.current) {
            setTimeout(() => {
                titleInputRef.current.focus();
            }, 100);
        }
        if (!isOpen) {
            setTitle("");
            setTabType("text");
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post(`/projects/${projectId}/tabs`, {
                title,
                type: tabType,
            });
            toast.success(`Tab "${title}" created!`);
            onSuccess(response.data);
        } catch (err) {
            const errorMessage = err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || "Failed to create tab";
            toast.error(errorMessage);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={formStyles.formContainer}>
            <input
                ref={titleInputRef}
                className={formStyles.input}
                type="text"
                placeholder="Tab Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
            />

            <select value={tabType} onChange={(e) => setTabType(e.target.value)} className={formStyles.input} required>
                <option value="text">📄 Text Document</option>
                <option value="board">🎨 Drawing Board</option>
                <option value="code">💻 Code Editor</option>
                <option value="mindmap">🧠 Mind Map</option>
            </select>

            <button type="submit" className={`${formStyles.button} ${formStyles.primaryButton}`}>
                Create Tab
            </button>
        </form>
    );
};

export default CreateTabForm;
