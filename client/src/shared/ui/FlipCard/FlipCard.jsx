// src/shared/ui/FlipCard/FlipCard.jsx
import React from "react";
import styles from "./FlipCard.module.css";

/**
 * Компонент карточки с эффектом переворота.
 * @param {React.ReactNode} frontContent - Контент для передней стороны.
 * @param {React.ReactNode} backContent - Контент для задней стороны.
 * @param {string} [className] - Дополнительные классы для кастомизации.
 */
const FlipCard = ({ frontContent, backContent, className }) => {
    return (
        <div className={`${styles.card} ${className || ""}`}>
            <div className={styles.cardInner}>
                <div className={`${styles.cardFace} ${styles.cardFront}`}>{frontContent}</div>
                <div className={`${styles.cardFace} ${styles.cardBack}`}>{backContent}</div>
            </div>
        </div>
    );
};

export default FlipCard;
