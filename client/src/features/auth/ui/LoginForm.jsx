// src/features/auth/ui/LoginForm.jsx
import { React, useState } from "react";
import styles from "./LoginForm.module.css"; // Импортируем стили как модуль
import { useAuth } from "../../../app/providers/AuthProvider"; // Раскомментируете, когда будете подключать логику
import { useNavigate } from "react-router-dom";

// Предположим, иконки лежат в assets
// import yandexIcon from '../../../shared/assets/yandex.svg';
// import googleIcon from '../../../shared/assets/google.svg';

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
        <form className={styles.formContainer} onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder="имя пользователя"
                className={styles.input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <input type="password" placeholder="пароль" className={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} />

            <div className={styles.socialLogin}>
                <button type="submit" className={styles.button} style={{ flex: 1, marginRight: "10px" }}>
                    Войти
                </button>
                <div className={styles.socialIcon}>
                    {/* <img src={yandexIcon} alt="Yandex Login" /> */}
                    <span>Я</span> {/* Заглушка */}
                </div>
                <div className={styles.socialIcon}>
                    {/* <img src={googleIcon} alt="Google Login" /> */}
                    <span>G</span> {/* Заглушка */}
                </div>
            </div>
        </form>
    );
};

export default LoginForm;
