// src/widgets/Header/ui/Header.jsx
import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import styles from "./Header.module.css";
import toast from "react-hot-toast";

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        toast.success("You have been logged out.");
        navigate("/login");
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
                        <span>Hi, {user.username}!</span>
                        <NavLink to="/settings" className={styles.navLink}>
                            Settings
                        </NavLink>
                        <button onClick={handleLogout} className={styles.logoutButton}>
                            Log out
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
