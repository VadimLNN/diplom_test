// src/shared/ui/EmptyState/EmptyState.jsx
import React from "react";
import styles from "./EmptyState.module.css";

const EmptyState = ({ icon, title, message, children }) => {
    return (
        <div className={styles.container}>
            {icon && <div className={styles.icon}>{icon}</div>}
            {title && <h3 className={styles.title}>{title}</h3>}
            {message && <p className={styles.message}>{message}</p>}
            {children && <div style={{ marginTop: "20px" }}>{children}</div>}
        </div>
    );
};

export default EmptyState;
