import React, { useState } from "react";
import { useAuth } from "../../../../app/providers/AuthProvider";
import api from "../../../../shared/api/axios";
import Card from "../../../../shared/ui/Card/Card";
import formStyles from "../../../auth/ui/Form.module.css";
import toast from "react-hot-toast";

const DeleteAccountSection = () => {
    const [password, setPassword] = useState("");
    const { logout } = useAuth();

    const handleDelete = async () => {
        if (window.confirm("Are you absolutely sure? This action cannot be undone.")) {
            try {
                await api.delete("/auth/delete-account", { data: { password } }); // ВАЖНО: `data` для DELETE запросов
                toast.success("Your account has been deleted.");
                logout(); // Выходим из системы
            } catch (error) {
                toast.error(error.response?.data?.error || "Failed to delete account.");
            }
        }
    };

    return (
        <Card>
            <h3 style={{ color: "var(--color-danger)" }}>Danger Zone</h3>
            <p>Once you delete your account, there is no going back. Please be certain.</p>
            <input
                className={formStyles.input}
                type="password"
                placeholder="Confirm your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <button onClick={handleDelete} className="btn-danger">
                Delete My Account
            </button>
        </Card>
    );
};

export default DeleteAccountSection;
