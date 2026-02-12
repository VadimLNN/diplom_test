// src/pages/ProjectDetailPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../shared/api/axios";
import ProjectMembers from "../features/projects/manage-members/ui/ProjectMembers";
import ProjectSettings from "../features/projects/settings/ui/ProjectSettings";
import Modal from "../shared/ui/Modal/Modal";
import CreateTabForm from "../features/tabs/create_tab/ui/CreateTabForm";
import TabGrid from "../widgets/TabGrid/ui/TabGrid";

import pageStyles from "./PageStyles.module.css";
import styles from "./ProjectDetailPage.module.css";

const ProjectDetailPage = () => {
    const { projectId } = useParams();
    const [activeTab, setActiveTab] = useState("tabs");

    const navigate = useNavigate();

    // Состояния
    const [project, setProject] = useState(null);
    const [tabs, setTabs] = useState([]);
    const [userRole, setUserRole] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [isCreateTabModalOpen, setIsCreateTabModalOpen] = useState(false);

    const handleTabClick = (tabId) => {
        navigate(`/projects/${projectId}/tabs/${tabId}`);
    };

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError("");

            // ✅ 1. Проект
            const projectRes = await api.get(`/projects/${projectId}`);
            setProject(projectRes.data);

            // ✅ 2. TABS вместо documents!
            const tabsRes = await api.get(`/projects/${projectId}/tabs`);
            setTabs(
                tabsRes.data.map((tab) => ({
                    ...tab,
                    project_id: projectId,
                })),
            );

            // ✅ 3. Роль
            try {
                const roleRes = await api.get(`/projects/${projectId}/permissions/my-role`);
                setUserRole(roleRes.data.role);
            } catch {
                setUserRole("viewer");
            }
        } catch (err) {
            setError("Failed to load project data.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleTabCreated = (newTab) => {
        setTabs((prev) => [newTab, ...prev]);
        setIsCreateTabModalOpen(false);
    };

    const handleDeleteTab = async (tabId) => {
        if (window.confirm("Delete this tab?")) {
            try {
                await api.delete(`/tabs/${tabId}`);
                setTabs((prev) => prev.filter((tab) => tab.id !== tabId));
            } catch (err) {
                alert("Failed to delete tab");
            }
        }
    };

    if (isLoading) return <div className={pageStyles.pageContainer}>Loading...</div>;
    if (error)
        return (
            <div className={pageStyles.pageContainer}>
                <p style={{ color: "red" }}>{error}</p>
            </div>
        );

    return (
        <div className={`${pageStyles.pageContainer} ${styles.editorLayout}`}>
            <div className={styles.breadcrumbs}>
                <Link to="/projects">My Projects</Link> / {project.name}
            </div>

            <header className={styles.projectHeader}>
                <h1>{project.name}</h1>
                <p>{project.description}</p>
            </header>

            {/* ✅ Tabs навигация */}
            <div className={styles.tabs}>
                <button className={`${styles.tabButton} ${activeTab === "tabs" ? styles.active : ""}`} onClick={() => setActiveTab("tabs")}>
                    🖥️ Tabs ({tabs.length})
                </button>
                <button className={`${styles.tabButton} ${activeTab === "members" ? styles.active : ""}`} onClick={() => setActiveTab("members")}>
                    👥 Members
                </button>
                {userRole === "owner" && (
                    <button
                        className={`${styles.tabButton} ${activeTab === "settings" ? styles.active : ""}`}
                        onClick={() => setActiveTab("settings")}
                    >
                        ⚙️ Settings
                    </button>
                )}
            </div>

            <div className={styles.tabContent}>
                {activeTab === "tabs" && (
                    <>
                        <div className={styles.tabsHeader}>
                            <h3>Collaborative Workspace</h3>
                            <button onClick={() => setIsCreateTabModalOpen(true)} className={styles.createTabButton}>
                                + New Tab
                            </button>
                        </div>

                        <TabGrid
                            tabs={tabs}
                            onCreateClick={() => setIsCreateTabModalOpen(true)}
                            userRole={userRole}
                            onTabClick={handleTabClick}
                            onDeleteTab={handleDeleteTab}
                        />
                    </>
                )}

                {activeTab === "members" && <ProjectMembers projectId={projectId} userRole={userRole} />}
                {activeTab === "settings" && userRole === "owner" && <ProjectSettings project={project} />}
            </div>

            <Modal isOpen={isCreateTabModalOpen} onClose={() => setIsCreateTabModalOpen(false)} title="Create New Tab">
                <CreateTabForm projectId={projectId} onSuccess={handleTabCreated} />
            </Modal>
        </div>
    );
};

export default ProjectDetailPage;
