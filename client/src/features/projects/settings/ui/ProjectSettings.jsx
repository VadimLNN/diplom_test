// src/features/project/settings/ui/ProjectSettings.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../shared/api/axios";
import Card from "../../../../shared/ui/Card/Card";
import formStyles from "../../../auth/ui/Form.module.css"; // Переиспользуем стили
import styles from "./ProjectSettings.module.css";

const ProjectSettings = ({ project }) => {
    const [name, setName] = useState(project.name);
    const [description, setDescription] = useState(project.description);
    const navigate = useNavigate();

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/projects/${project.id}`, { name, description });
            alert("Project updated successfully!");
        } catch (error) {
            alert(error.response?.data?.error || "Failed to update project.");
        }
    };

    const handleDelete = async () => {
        if (window.confirm(`Are you sure you want to delete the project "${project.name}"? This action cannot be undone.`)) {
            try {
                await api.delete(`/projects/${project.id}`);
                alert("Project deleted successfully.");
                navigate("/projects"); // Возвращаем на главную после удаления
            } catch (error) {
                alert(error.response?.data?.error || "Failed to delete project.");
            }
        }
    };

    return (
        <div className={styles.container}>
            <Card>
                <h3 style={{ marginTop: 0 }}>General Settings</h3>
                <form onSubmit={handleUpdate} className={formStyles.formContainer}>
                    <input className={formStyles.input} type="text" value={name} onChange={(e) => setName(e.target.value)} />
                    <textarea
                        className={formStyles.input} // Можно создать отдельный класс для textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows="4"
                        style={{ height: "auto", borderRadius: "16px" }}
                    />
                    <button type="submit" className={formStyles.button}>
                        Save Changes
                    </button>
                </form>
            </Card>

            <Card>
                <h3 className={styles.dangerZoneTitle}>Danger Zone</h3>
                <div className={styles.dangerZoneContent}>
                    <p>Deleting a project will permanently remove all its documents and members.</p>
                    <button onClick={handleDelete} className={styles.deleteButton}>
                        Delete this project
                    </button>
                </div>
            </Card>
        </div>
    );
};

export default ProjectSettings;
