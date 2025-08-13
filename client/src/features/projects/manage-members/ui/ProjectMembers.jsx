// src/features/project/manage-members/ui/ProjectMembers.jsx
import React, { useState, useEffect, useCallback } from "react";
import api from "../../../../shared/api/axios";
import Card from "../../../../shared/ui/Card/Card";
import styles from "./ProjectMembers.module.css";
import toast from "react-hot-toast";

const ProjectMembers = ({ projectId, userRole }) => {
    const [members, setMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState("");

    const fetchMembers = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await api.get(`/projects/${projectId}/permissions`);
            setMembers(response.data);
        } catch (err) {
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
        if (!inviteEmail) return;

        await toast.promise(api.post(`/projects/${projectId}/permissions`, { email: inviteEmail, role: "editor" }), {
            loading: "Sending invitation...",
            success: () => {
                setInviteEmail("");
                fetchMembers(); // Обновляем список в фоне
                return <b>Invitation sent to {inviteEmail}</b>;
            },
            error: (err) => <b>{err.response?.data?.error || "Failed to invite user"}</b>,
        });
    };

    const handleRemove = async (userId, username) => {
        toast(
            (t) => (
                <span>
                    <div className="toast-container">
                        <span>
                            Remove <b>{username}</b>?
                        </span>
                        <div style={{ display: "flex", gap: "8px" }}>
                            {/* Кнопка отмены */}
                            <button className="toast-button toast-button-cancel" onClick={() => toast.dismiss(t.id)}>
                                Cancel
                            </button>
                            {/* Кнопка подтверждения */}
                            <button
                                className="toast-button toast-button-confirm"
                                onClick={() => {
                                    toast.dismiss(t.id);
                                    toast.promise(/* ... promise для удаления ... */);
                                }}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </span>
            ),
            { duration: 6000, icon: "🤔" }
        );
    };

    if (isLoading) return <p>Loading members...</p>;

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
                                {userRole === "owner" && member.role !== "owner" && (
                                    <button onClick={() => handleRemove(member.id, member.username)} className={styles.removeButton}>
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
