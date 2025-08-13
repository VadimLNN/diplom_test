import React, { useState } from "react";
import api from "../../../../shared/api/axios";
import Card from "../../../../shared/ui/Card/Card";
import formStyles from "../../../auth/ui/Form.module.css";
import toast from "react-hot-toast";

const ChangePasswordForm = () => {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        await toast.promise(api.put("/auth/change-password", { currentPassword, newPassword }), {
            loading: "Updating password...",
            success: () => {
                setCurrentPassword("");
                setNewPassword("");
                return <b>Password updated successfully!</b>;
            },
            error: (err) => <b>{err.response?.data?.error || "Failed to change password."}</b>,
        });
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
            </form>
        </Card>
    );
};

export default ChangePasswordForm;
