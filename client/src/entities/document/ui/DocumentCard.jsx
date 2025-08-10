// src/entities/document/ui/DocumentCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../../shared/ui/Card/Card";
// Мы можем переиспользовать стили от ProjectCard, если они похожи!
import cardStyles from "../../project/ui/ProjectCard.module.css";

const DocumentCard = ({ document }) => {
    const navigate = useNavigate();

    const handleOpenDocument = () => {
        // Пока не создали страницу редактора, можно оставить так
        alert(`Opening document ${document.id}`);
        // navigate(`/documents/${document.id}`);
    };

    return (
        <Card className={cardStyles.projectCard}>
            <h3 className={cardStyles.title}>{document.title}</h3>
            <p className={cardStyles.description}>{document.content ? `${document.content.substring(0, 100)}...` : "This document is empty."}</p>
            <div className={cardStyles.footer}>
                <span className={cardStyles.date}>Updated: {new Date(document.updated_at).toLocaleDateString()}</span>
                <button onClick={handleOpenDocument} className={cardStyles.openButton}>
                    Open
                </button>
            </div>
        </Card>
    );
};

export default DocumentCard;
