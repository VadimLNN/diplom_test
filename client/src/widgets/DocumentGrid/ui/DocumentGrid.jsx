// src/widgets/DocumentGrid/ui/DocumentGrid.jsx
import React from "react";
import DocumentCard from "../../../entities/document/ui/DocumentCard";
// Переиспользуем стили от сетки проектов
import gridStyles from "../../ProjectGrid/ui/ProjectGrid.module.css";

const DocumentGrid = ({ documents, userRole, onDeleteDocument }) => {
    if (!documents || documents.length === 0) {
        return <p>No documents in this project yet.</p>;
    }

    return (
        <div className={gridStyles.grid}>
            {documents.map((doc) => (
                <DocumentCard key={doc.id} document={doc} />
            ))}
        </div>
    );
};

export default DocumentGrid;
