// src/features/auth/ui/RegisterForm.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../shared/api/axios";
import styles from "./Form.module.css";
import toast from "react-hot-toast";

const RegisterForm = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        await toast.promise(api.post("/auth/register", { username, email, password }), {
            loading: "Registering...",
            success: (response) => {
                setTimeout(() => navigate("/login"), 1500);
                return <b>Registration successful! Redirecting...</b>;
            },
            error: (err) => <b>{err.response?.data?.error || "Registration failed"}</b>,
        });
    };

    return (
        <div className="card">
            <h1>Register</h1>
            <form onSubmit={handleSubmit} className={styles.formContainer}>
                <input
                    type="text"
                    placeholder="имя пользователя"
                    className={styles.input}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input type="email" placeholder="email" className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input
                    type="password"
                    placeholder="пароль"
                    className={styles.input}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <button type="submit" className={styles.button}>
                    Зарегистрироваться
                </button>
            </form>
        </div>
    );
};

export default RegisterForm;
