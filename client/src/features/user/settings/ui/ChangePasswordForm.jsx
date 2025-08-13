import React, { useState } from "react";
import api from "../../../../shared/api/axios";
import Card from "../../../../shared/ui/Card/Card";
import formStyles from "../../../auth/ui/Form.module.css";

const ChangePasswordForm = () => {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        try {
            await api.put("/auth/change-password", { currentPassword, newPassword });
            setMessage({ text: "Password changed successfully!", type: "success" });
            setCurrentPassword("");
            setNewPassword("");
        } catch (error) {
            setMessage({ text: error.response?.data?.error || "Failed to change password.", type: "error" });
        }
    };

    return (
        <Card>
            <h3 style={{ marginTop: 0 }}>Change Password</h3>
            <form onSubmit={handleSubmit} className={formStyles.formContainer}>
                <input
                    className={formStyles.input}
                    type="password"
                    placeholder="Current Password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                />
                <input
                    className={formStyles.input}
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                />
                <button type="submit" className={`${formStyles.button} ${formStyles.primaryButton}`}>
                    Update Password
                </button>
                {message && <p style={{ color: message.type === "success" ? "green" : "red" }}>{message.text}</p>}
            </form>
        </Card>
    );
};

export default ChangePasswordForm;
