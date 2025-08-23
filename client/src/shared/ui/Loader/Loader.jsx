// src/shared/ui/Loader/Loader.jsx
import React from "react";
import styles from "./Loader.module.css";

const Loader = () => {
    return (
        <div className={styles.loaderContainer}>
            <div className={styles.loader}>
                <span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                </span>
                <div className={styles.base}>
                    <span></span>
                    <div className={styles.face}></div>
                </div>
            </div>
            <div className={styles.longfazers}>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    );
};

export default Loader;
