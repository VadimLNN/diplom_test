import React from "react";
import styles from "./Card.module.css";

const Card = ({ children, className }) => {
    // className позволяет добавлять доп. стили извне
    return <div className={`${styles.card} ${className || ""}`}>{children}</div>;
};

export default Card;
