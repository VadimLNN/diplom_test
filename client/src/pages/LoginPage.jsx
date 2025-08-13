// src/pages/LoginPage.jsx
import React from "react";
import LoginForm from "../features/auth/ui/LoginForm.jsx";
import styles from "./PageStyles.module.css";

const LoginPage = () => {
    return (
        <div className={`${styles.pageContainer} ${styles.pageCentered}`}>
            <LoginForm />
        </div>
    );
};

export default LoginPage;
