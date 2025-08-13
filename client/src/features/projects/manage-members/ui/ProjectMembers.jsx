// src/features/project/manage-members/ui/ProjectMembers.jsx
import React, { useState, useEffect, useCallback } from "react";
import api from "../../../../shared/api/axios";
import Card from "../../../../shared/ui/Card/Card";
import styles from "./ProjectMembers.module.css";

const ProjectMembers = ({ projectId, userRole }) => {
    const [members, setMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [inviteEmail, setInviteEmail] = useState("");

    const fetchMembers = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await api.get(`/projects/${projectId}/permissions`);
            setMembers(response.data);
            setError("");
        } catch (err) {
            setError("Failed to load members.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const handleInvite = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await api.post(`/projects/${projectId}/permissions`, { email: inviteEmail, role: "editor" }); // Пока хардкодим роль 'editor'
            setInviteEmail("");
            fetchMembers(); // Обновляем список
        } catch (err) {
            setError(err.response?.data?.error || "Failed to invite user");
        }
    };

    const handleRemove = async (userId) => {
        if (window.confirm("Are you sure you want to remove this member?")) {
            try {
                await api.delete(`/projects/${projectId}/permissions/${userId}`);
                fetchMembers(); // Обновляем список
            } catch (err) {
                setError(err.response?.data?.error || "Failed to remove user");
            }
        }
    };

    if (isLoading) return <p>Loading members...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <div className={styles.container}>
            {/* --- ШАГ 1: Показываем форму приглашения ТОЛЬКО владельцу --- */}
            {userRole === "owner" && (
                <Card>
                    <h3 style={{ marginTop: 0 }}>Invite a new member</h3>
                    <form onSubmit={handleInvite} className={styles.inviteForm}>
                        <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="Enter user email"
                            className={styles.inviteInput}
                            required
                        />
                        {/* TODO: Добавить выпадающий список для выбора роли ('editor' или 'viewer') */}
                        <button type="submit" className="btn-primary">
                            Invite
                        </button>
                    </form>
                </Card>
            )}

            <div>
                <h3>Team Members ({members.length})</h3>
                <ul className={styles.membersList}>
                    {members.map((member) => (
                        <li key={member.id} className={styles.memberItem}>
                            <div className={styles.userInfo}>
                                <span className={styles.username}>{member.username}</span>
                                <span className={styles.email}>{member.email}</span>
                            </div>
                            <div className={styles.actions}>
                                <span className={styles.role}>{member.role}</span>
                                {/* --- ШАГ 2: Показываем кнопку удаления ТОЛЬКО владельцу и НЕ для самого себя --- */}
                                {userRole === "owner" && member.role !== "owner" && (
                                    <button onClick={() => handleRemove(member.id)} className={styles.removeButton}>
                                        Remove
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default ProjectMembers;
