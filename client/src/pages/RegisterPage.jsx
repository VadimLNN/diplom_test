// src/pages/RegisterPage.jsx
import React from "react";
import RegisterForm from "../features/auth/ui/RegisterForm.jsx";
import styles from "./PageStyles.module.css"; // 1. Импортируем стили

const RegisterPage = () => {
    return (
        // 2. Применяем те же самые классы
        <div className={`${styles.pageContainer} ${styles.pageCentered}`}>
            <RegisterForm />
        </div>
    );
};

export default RegisterPage;
