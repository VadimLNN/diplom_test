import React, { useState, useEffect, useRef } from "react";
import api from "../../../../shared/api/axios";
import formStyles from "../../../auth/ui/Form.module.css";
import toast from "react-hot-toast";

const CreateDocumentForm = ({ projectId, onSuccess, isOpen }) => {
    const [title, setTitle] = useState("");
    const titleInputRef = useRef(null);

    useEffect(() => {
        if (isOpen && titleInputRef.current) {
            setTimeout(() => {
                titleInputRef.current.focus();
            }, 100);
        }
        if (!isOpen) {
            setTitle("");
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post(`/documents/project/${projectId}`, { title, content: "" });
            toast.success(`Document "${title}" created!`);
            onSuccess(response.data);
        } catch (err) {
            const errorMessage = err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || "Failed to create document";
            toast.error(errorMessage);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={formStyles.formContainer}>
            <input
                ref={titleInputRef}
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
        </form>
    );
};

export default CreateDocumentForm;
