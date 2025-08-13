// src/features/project/settings/ui/ProjectSettings.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../shared/api/axios";
import Card from "../../../../shared/ui/Card/Card";
import formStyles from "../../../auth/ui/Form.module.css"; // Переиспользуем стили
import styles from "./ProjectSettings.module.css";
import toast from "react-hot-toast";

const ProjectSettings = ({ project }) => {
    const [name, setName] = useState(project.name);
    const [description, setDescription] = useState(project.description);
    const navigate = useNavigate();

    const handleUpdate = async (e) => {
        e.preventDefault();
        await toast.promise(api.put(`/projects/${project.id}`, { name, description }), {
            loading: "Saving changes...",
            success: <b>Project updated successfully!</b>,
            error: (err) => <b>{err.response?.data?.error || "Failed to update project."}</b>,
        });
    };

    const handleDelete = async () => {
        toast(
            (t) => (
                <div className="toast-container">
                    <span>
                        Delete <b>"{project.name}"</b>?
                    </span>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button className="toast-button toast-button-cancel" onClick={() => toast.dismiss(t.id)}>
                            Cancel
                        </button>
                        <button
                            className="toast-button toast-button-confirm"
                            onClick={() => {
                                toast.dismiss(t.id);
                                toast.promise(api.delete(`/projects/${project.id}`), {
                                    loading: `Deleting project...`,
                                    success: () => {
                                        navigate("/projects");
                                        return <b>Project has been deleted.</b>;
                                    },
                                    error: (err) => <b>{err.response?.data?.error || "Failed to delete project."}</b>,
                                });
                            }}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            ),
            {
                duration: 10000,
                icon: "⚠️",
            }
        );
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
