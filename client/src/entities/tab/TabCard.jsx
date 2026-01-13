// src/entities/tab/ui/TabCard.jsx
import React from "react";
import Card from "../../shared/ui/Card/Card";
import cardStyles from "../../entities/project/ui/ProjectCard"; // ✅ Тот же стиль!

const TabCard = ({ tab, isActive, onClick, onDelete }) => {
    const getIcon = (type) => {
        const icons = {
            text: "📄",
            board: "🎨",
            code: "💻",
            mindmap: "🧠",
        };
        return icons[type] || "📋";
    };

    const handleOpenTab = () => {
        onClick(tab.id); // ✅ Открываем TabEditor вместо navigate
    };

    const handleDeleteTab = (e) => {
        e.stopPropagation(); // ✅ Не открываем при клике на delete
        onDelete(tab.id);
    };

    return (
        <Card className={`${cardStyles.projectCard} ${isActive ? cardStyles.active : ""}`}>
            <div className={cardStyles.header}>
                <span className={cardStyles.icon}>{getIcon(tab.type)}</span>
                <div>
                    <h3 className={cardStyles.title}>{tab.title}</h3>
                    <span className={cardStyles.type}>{tab.type}</span>
                </div>
            </div>

            <p className={cardStyles.description}>
                {tab.type === "text"
                    ? "Collaborative text editor"
                    : tab.type === "board"
                    ? "Drawing canvas"
                    : tab.type === "code"
                    ? "Live code editor"
                    : "Mind mapping"}
            </p>

            <div className={cardStyles.footer}>
                <span className={cardStyles.date}>Updated: {new Date(tab.created_at).toLocaleDateString()}</span>
                <div className={cardStyles.actions}>
                    {onDelete && (
                        <button onClick={handleDeleteTab} className={cardStyles.deleteButton}>
                            Delete
                        </button>
                    )}
                    <button onClick={handleOpenTab} className={cardStyles.openButton}>
                        {isActive ? "Editing..." : "Open"}
                    </button>
                </div>
            </div>
        </Card>
    );
};

export default TabCard;
