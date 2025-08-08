// src/widgets/Header/ui/Header.jsx
import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import styles from "./Header.module.css";

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout(); // Вызываем функцию logout из AuthContext
        navigate("/login"); // Перенаправляем на страницу входа
    };

    return (
        <header className={styles.header}>
            <div className={styles.logo}>
                <Link to={user ? "/projects" : "/"}>Collab App</Link>
            </div>
            <nav className={styles.nav}>
                {user ? (
                    // --- Меню для авторизованного пользователя ---
                    <>
                        <span>Привет, {user.username}!</span>
                        <NavLink to="/settings" className={styles.navLink}>
                            Настройки
                        </NavLink>
                        <button onClick={handleLogout} className={styles.logoutButton}>
                            Выйти
                        </button>
                    </>
                ) : (
                    // --- Меню для гостя ---
                    <>
                        <NavLink to="/login" className={styles.navLink}>
                            Login
                        </NavLink>
                        <NavLink to="/register" className={styles.navLink}>
                            Register
                        </NavLink>
                    </>
                )}
            </nav>
        </header>
    );
};

export default Header;
