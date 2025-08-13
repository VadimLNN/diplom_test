// src/entities/document/ui/DocumentCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../../shared/ui/Card/Card";
import cardStyles from "../../project/ui/ProjectCard.module.css";

const DocumentCard = ({ document, userRole }) => {
    const navigate = useNavigate();

    const handleOpenDocument = () => {
        navigate(`/documents/${document.id}`);
    };

    const handleDeleteDocument = () => {
        // TODO: Вызвать функцию удаления, переданную через props
        alert(`Deleting document ${document.id}`);
    };

    return (
        <Card className={cardStyles.projectCard}>
            <h3 className={cardStyles.title}>{document.title}</h3>
            <p className={cardStyles.description}>{document.content ? `${document.content.substring(0, 100)}...` : "This document is empty."}</p>
            <div className={cardStyles.footer}>
                <span className={cardStyles.date}>Updated: {new Date(document.updated_at).toLocaleDateString()}</span>
                <div className={cardStyles.actions}>
                    {" "}
                    {/* Добавим обертку для кнопок */}
                    {/* Показываем кнопку удаления только тем, у кого есть права */}
                    {(userRole === "owner" || userRole === "editor") && (
                        <button onClick={handleDeleteDocument} className={cardStyles.deleteButton}>
                            Delete
                        </button>
                    )}
                    <button onClick={handleOpenDocument} className={cardStyles.openButton}>
                        {userRole === "owner" || userRole === "editor" ? "Edit" : "View"}
                    </button>
                </div>
            </div>
        </Card>
    );
};

export default DocumentCard;
