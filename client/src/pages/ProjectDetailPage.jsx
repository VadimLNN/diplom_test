import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
// import { DocumentList } from '../widgets/DocumentList';
// import { ProjectMembers } from '../features/project/manage-members';
// import { ProjectSettings } from '../features/project/settings';

const ProjectDetailPage = () => {
    const { projectId } = useParams();
    const [activeTab, setActiveTab] = useState("documents");

    return (
        <div className="page-container">
            <p>
                <Link to="/projects">Проекты</Link> / Проект {projectId}
            </p>
            <h1>Название Проекта {projectId}</h1>
            <p>Описание проекта...</p>

            <div className="tabs">
                <button onClick={() => setActiveTab("documents")} className={activeTab === "documents" ? "active" : ""}>
                    Документы
                </button>
                <button onClick={() => setActiveTab("members")} className={activeTab === "members" ? "active" : ""}>
                    Участники
                </button>
                <button onClick={() => setActiveTab("settings")} className={activeTab === "settings" ? "active" : ""}>
                    Настройки
                </button>
            </div>

            <div className="tab-content">
                {activeTab === "documents" && <div>Контент вкладки "Документы"</div>}
                {activeTab === "members" && <div>Контент вкладки "Участники"</div>}
                {activeTab === "settings" && <div>Контент вкладки "Настройки"</div>}
            </div>
        </div>
    );
};

export default ProjectDetailPage;
