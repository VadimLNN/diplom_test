// src/pages/ProjectDetailPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../shared/api/axios";
import ProjectMembers from "../features/projects/manage-members/ui/ProjectMembers";
import ProjectSettings from "../features/projects/settings/ui/ProjectSettings";
import DocumentGrid from "../widgets/DocumentGrid/ui/DocumentGrid";
import Modal from "../shared/ui/Modal/Modal";
import CreateDocumentForm from "../features/document/create/ui/CreateDocumentForm";
import CollaborativeEditor from "../features/tabs/editor/ui/CollaborativeEditor";

// Импортируем стили
import pageStyles from "./PageStyles.module.css";
import styles from "./ProjectDetailPage.module.css"; // Стили для этой страницы

const ProjectDetailPage = () => {
    const { projectId } = useParams();
    const [activeTab, setActiveTab] = useState("documents");

    // Состояния
    const [project, setProject] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [userRole, setUserRole] = useState(null); // Роль нам все еще нужна для UI
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const [isCreateDocModalOpen, setIsCreateDocModalOpen] = useState(false);

    ////////////////////////////////////////////////////////////////////////////////////////////////////
    // Tabs (новая логика)
    const [tabs, setTabs] = useState([]);
    const [activeTabId, setActiveTabId] = useState(null);
    const [isCreatingTab, setIsCreatingTab] = useState(false);

    const handleCreateTab = async () => {
        try {
            setIsCreatingTab(true);

            const res = await api.post(`/projects/${projectId}/tabs`, {
                type: "text",
                title: `Tab ${tabs.length + 1}`,
            });

            setTabs((prev) => [...prev, res.data]);
            setActiveTabId(res.data.id);
        } catch (err) {
            alert(err.response?.data?.error || "Failed to create tab");
        } finally {
            setIsCreatingTab(false);
        }
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError("");

            const projectRes = await api.get(`/projects/${projectId}`);
            setProject(projectRes.data);

            const docsRes = await api.get(`/documents/project/${projectId}`);
            setDocuments(docsRes.data);

            const tabsRes = await api.get(`/projects/${projectId}/tabs`);
            setTabs(tabsRes.data);

            if (tabsRes.data.length > 0) {
                setActiveTabId(tabsRes.data[0].id);
            }

            try {
                const roleRes = await api.get(`/projects/${projectId}/permissions/my-role`);
                setUserRole(roleRes.data.role);
            } catch (roleError) {
                console.warn("Could not fetch user role, defaulting to 'viewer'.");
                setUserRole("viewer");
            }
        } catch (err) {
            setError("Failed to load project data. You may not have permission.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (isLoading)
        return (
            <div className={pageStyles.pageContainer}>
                <p>Loading project...</p>
            </div>
        );
    if (error)
        return (
            <div className={pageStyles.pageContainer}>
                <p style={{ color: "red" }}>{error}</p>
            </div>
        );

    const handleDocumentCreated = (newDocument) => {
        setDocuments((prevDocs) => [newDocument, ...prevDocs]);
        setIsCreateDocModalOpen(false);
    };

    const handleDeleteDocument = async (documentId) => {
        if (window.confirm("Are you sure you want to delete this document?")) {
            try {
                await api.delete(`/documents/${documentId}`);
                setDocuments((prevDocs) => prevDocs.filter((doc) => doc.id !== documentId));
            } catch (err) {
                alert(err.response?.data?.error || "Failed to delete document.");
            }
        }
    };

    return (
        <div className={`${pageStyles.pageContainer} ${styles.editorLayout}`}>
            <div className={styles.breadcrumbs}>
                <Link to="/projects">My Projects</Link> / {project.name}
            </div>

            <header className={styles.projectHeader}>
                <h1>{project.name}</h1>
                <p>{project.description}</p>
            </header>

            <div className={styles.tabs}>
                <button className={`${styles.tabButton} ${activeTab === "documents" ? styles.active : ""}`} onClick={() => setActiveTab("documents")}>
                    Documents
                </button>
                <button className={`${styles.tabButton} ${activeTab === "members" ? styles.active : ""}`} onClick={() => setActiveTab("members")}>
                    Members
                </button>
                <button className={`${styles.tabButton} ${activeTab === "tabs" ? styles.active : ""}`} onClick={() => setActiveTab("tabs")}>
                    Tabs
                </button>
                {userRole === "owner" && (
                    <button
                        className={`${styles.tabButton} ${activeTab === "settings" ? styles.active : ""}`}
                        onClick={() => setActiveTab("settings")}
                    >
                        Settings
                    </button>
                )}
            </div>

            <div className={styles.tabContent}>
                {activeTab === "documents" && (
                    <div>
                        <DocumentGrid
                            documents={documents}
                            userRole={userRole}
                            onDeleteDocument={handleDeleteDocument}
                            onCreateClick={() => setIsCreateDocModalOpen(true)}
                        />
                    </div>
                )}

                {activeTab === "members" && <ProjectMembers projectId={projectId} userRole={userRole} />}

                {activeTab === "settings" && userRole === "owner" && <ProjectSettings project={project} />}

                {activeTab === "tabs" && (
                    <div>
                        <div style={{ marginBottom: 12 }}>
                            <button onClick={handleCreateTab} disabled={isCreatingTab}>
                                + Create tab
                            </button>
                        </div>

                        {tabs.length === 0 && <p>No tabs yet</p>}

                        <ul>
                            {tabs.map((tab) => (
                                <li key={tab.id}>
                                    <button
                                        onClick={() => setActiveTabId(tab.id)}
                                        style={{
                                            fontWeight: tab.id === activeTabId ? "bold" : "normal",
                                        }}
                                    >
                                        {tab.title} ({tab.type})
                                    </button>
                                </li>
                            ))}
                        </ul>

                        {activeTabId && (
                            <div style={{ marginTop: 16 }}>
                                <CollaborativeEditor tabId={activeTabId} />
                            </div>
                        )}
                    </div>
                )}
            </div>

            <Modal isOpen={isCreateDocModalOpen} onClose={() => setIsCreateDocModalOpen(false)} title="Create a New Document">
                <CreateDocumentForm projectId={projectId} onSuccess={handleDocumentCreated} isOpen={isCreateDocModalOpen} />
            </Modal>
        </div>
    );
};

export default ProjectDetailPage;
