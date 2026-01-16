// src/pages/DocumentEditorPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../shared/api/axios";
import TabEditor from "../features/tabs/editor/ui/TabEditor"; // ✅ TabEditor!
import pageStyles from "./PageStyles.module.css";
import styles from "./DocumentEditorPage.module.css";

const DocumentEditorPage = () => {
    const { projectId, tabId } = useParams(); // ✅ tabId!
    const navigate = useNavigate();

    const [tab, setTab] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchTab = async () => {
            try {
                setIsLoading(true);
                // ✅ Загружаем конкретный tab
                const response = await api.get(`/projects/${projectId}/tabs/${tabId}`);
                setTab(response.data);
            } catch (err) {
                setError("Failed to load tab");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        if (tabId && projectId) fetchTab();
    }, [tabId, projectId]);

    if (isLoading) {
        return <div className={pageStyles.pageContainer}>🔄 Loading editor...</div>;
    }

    if (error || !tab) {
        return (
            <div className={pageStyles.pageContainer}>
                <p style={{ color: "red" }}>{error || "Tab not found"}</p>
                <Link to={`/projects/${projectId}`} className={styles.backButton}>
                    ← Back to Project
                </Link>
            </div>
        );
    }

    return (
        <div className={`${pageStyles.pageContainer} ${styles.fullEditor}`}>
            {/* Header */}
            <div className={styles.header}>
                <Link to={`/projects/${projectId}`} className={styles.backLink}>
                    ← {tab.project_name || "Project"}
                </Link>
                <div>
                    <h1>{tab.title}</h1>
                </div>
            </div>

            {/* ✅ TabEditor — 100% рабочий! */}
            <div className={styles.editorContainer}>
                <TabEditor tab={tab} />
            </div>
        </div>
    );
};

export default DocumentEditorPage;
