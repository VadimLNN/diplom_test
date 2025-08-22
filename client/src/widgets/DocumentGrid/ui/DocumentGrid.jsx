// src/widgets/DocumentGrid/ui/DocumentGrid.jsx
import React from "react";
import DocumentCard from "../../../entities/document/ui/DocumentCard";
import gridStyles from "../../ProjectGrid/ui/ProjectGrid.module.css";
import EmptyState from "../../../shared/ui/EmptyState/EmptyState";

const DocumentGrid = ({ documents, userRole, onCreateClick }) => {
    if (!documents || documents.length === 0) {
        return (
            <EmptyState icon="📄" title="No Documents in This Project" message="Every great project starts with a single document. Create one now!">
                {(userRole === "owner" || userRole === "editor") && (
                    <button onClick={onCreateClick} className="btn-primary">
                        + Create a New Document
                    </button>
                )}
            </EmptyState>
        );
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
