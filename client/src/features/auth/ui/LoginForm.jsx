// src/features/auth/ui/LoginForm.jsx
import { React, useState } from "react";
import styles from "./Form.module.css"; // Импортируем стили как модуль
import { useAuth } from "../../../app/providers/AuthProvider"; // Раскомментируете, когда будете подключать логику
import { useNavigate } from "react-router-dom";

const LoginForm = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login({ username, password });
            navigate("/projects");
        } catch (error) {
            console.error("Login failed", error);
        }
        console.log("Form submitted!");
    };

    return (
        <div className="card">
            <h1>Login</h1>
            <form className={styles.formContainer} onSubmit={handleSubmit}>
                <input
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
