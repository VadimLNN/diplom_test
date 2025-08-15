// src/features/auth/ui/LoginForm.jsx
import { React, useState, useEffect, useRef } from "react";
import styles from "./Form.module.css"; // Импортируем стили как модуль
import { useAuth } from "../../../app/providers/AuthProvider"; // Раскомментируете, когда будете подключать логику
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const LoginForm = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();

    const usernameInputRef = useRef(null);

    useEffect(() => {
        if (usernameInputRef.current) {
            usernameInputRef.current.focus();
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        await toast.promise(
            login({ username, password }), // Вызываем функцию login из useAuth
            {
                loading: "Logging in...",
                success: (response) => {
                    navigate("/projects");
                    return <b>Welcome back!</b>;
                },
                error: (err) => <b>{err.response?.data?.error || "Login failed!"}</b>,
            }
        );
    };

    return (
        <div className="card">
            <h1>Login</h1>
            <form className={styles.formContainer} onSubmit={handleSubmit}>
                <input
                    ref={usernameInputRef}
                    type="text"
                    placeholder="имя пользователя"
                    className={styles.input}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input type="password" placeholder="пароль" className={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} />

                <button type="submit" className={styles.button}>
                    Войти
                </button>
            </form>
        </div>
    );
};

export default LoginForm;
