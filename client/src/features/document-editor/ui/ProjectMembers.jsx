// features/manage-project-members/ui/ProjectMembers.jsx
import React, { useState, useEffect } from "react";
import api from "../../../shared/api/axios";

const ProjectMembers = ({ projectId }) => {
    const [members, setMembers] = useState([]);
    const [inviteEmail, setInviteEmail] = useState("");
    const [error, setError] = useState("");

    const fetchMembers = async () => {
        try {
            const response = await api.get(`/projects/${projectId}/permissions`);
            setMembers(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (projectId) {
            fetchMembers();
        }
    }, [projectId]);

    const handleInvite = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await api.post(`/projects/${projectId}/permissions`, { email: inviteEmail, role: "editor" });
            setInviteEmail("");
            fetchMembers(); // Обновляем список участников
        } catch (err) {
            setError(err.response?.data?.error || "Failed to invite user");
        }
    };

    const handleRemove = async (userId) => {
        try {
            await api.delete(`/projects/${projectId}/permissions/${userId}`);
            fetchMembers(); // Обновляем список
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="card">
            <h2>Project Members</h2>
            {error && <div className="message error">{error}</div>}
            <form onSubmit={handleInvite} className="form">
                <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter user email to invite"
                    required
                />
                <button type="submit" className="btn btn-primary">
                    Invite
                </button>
            </form>

            <ul className="member-list">
                {members.map((member) => (
                    <li key={member.id}>
                        {member.username} ({member.email}) - {member.role}
                        <button onClick={() => handleRemove(member.id)} className="btn btn-danger btn-sm">
                            Remove
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ProjectMembers;
