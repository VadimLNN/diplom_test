// src/features/auth/ui/RegisterForm.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../shared/api/axios";

// Мы можем переиспользовать те же стили, что и для LoginForm!
import styles from "./LoginForm.module.css";

const RegisterForm = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(""); // Сбрасываем сообщение перед новым запросом
        try {
            await api.post("/auth/register", { username, email, password });
            setMessage("Registration successful! Redirecting to login...");

            // Даем пользователю 2 секунды, чтобы прочитать сообщение, потом перенаправляем
            setTimeout(() => {
                navigate("/login");
            }, 2000);
        } catch (error) {
            setMessage(error.response?.data?.error || "Registration failed");
        }
    };

    return (
        <div className="card">
            {" "}
            {/* Используем общий класс .card для нойморфизма */}
            <h2>Register</h2>
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
            {message && <p className={`message ${message.includes("successful") ? "success" : "error"}`}>{message}</p>}
        </div>
    );
};

export default RegisterForm;
