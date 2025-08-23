// src/pages/DocumentEditorPage.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../shared/api/axios";
import CollaborativeEditor from "../features/document/editor/ui/CollaborativeEditor";
import pageStyles from "./PageStyles.module.css";
import styles from "./DocumentEditorPage.module.css"; // Создадим этот файл

const DocumentEditorPage = () => {
    const { documentId } = useParams();
    const [document, setDocument] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [userRole, setUserRole] = useState(null);

    const saveTimeoutRef = useRef(null);

    const fetchDocumentData = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await api.get(`/documents/${documentId}`);
            setDocument(response.data);
            // Заодно получим роль, чтобы знать, можно ли редактировать
            const roleResponse = await api.get(`/projects/${response.data.project_id}/permissions/my-role`);
            setUserRole(roleResponse.data.role);
        } catch (err) {
            setError("Failed to load document. You may not have permission.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [documentId]);

    useEffect(() => {
        fetchDocumentData();
    }, [fetchDocumentData]);

    const handleSave = useCallback(async (docId, updatedContent) => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(async () => {
            try {
                await api.put(`/documents/${docId}`, { content: updatedContent });
                console.log("Autosaved successfully!");
                // Можно показать toast.success('Saved!')
            } catch (error) {
                console.error("Failed to autosave document:", error);
            }
        }, 2000); // Задержка 2 секунды
    }, []);

    if (isLoading)
        return (
            <div className={pageStyles.pageContainer}>
                <p>Loading document...</p>
            </div>
        );
    if (error)
        return (
            <div className={pageStyles.pageContainer}>
                <p style={{ color: "red" }}>{error}</p>
            </div>
        );
    if (!document)
        return (
            <div className={pageStyles.pageContainer}>
                <p>Document not found</p>
            </div>
        );

    return (
        <div className={`${pageStyles.pageContainer} ${styles.editorLayout}`}>
            <header className={styles.editorHeader}>
                <div className={styles.breadcrumbs}>
                    <Link to="/projects">My Projects</Link> /<Link to={`/projects/${document.project_id}`}>Project</Link> /
                    <span>{document.title}</span>
                </div>
            </header>

            <main className={styles.editorContent}>
                <CollaborativeEditor
                    documentId={document.id}
                    onSave={handleSave} // <-- 5. ПЕРЕДАЕМ ФУНКЦИЮ В РЕДАКТОР
                    isReadOnly={userRole === "viewer"}
                />
            </main>
        </div>
    );
};

export default DocumentEditorPage;
