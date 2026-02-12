// src/widgets/TabGrid/ui/TabGrid.jsx
import React from "react";
import TabCard from "../../../entities/tab/TabCard"; // ✅ Аналог DocumentCard
import gridStyles from "../../ProjectGrid/ui/ProjectGrid.module.css"; // ✅ Тот же стиль сетки
import EmptyState from "../../../shared/ui/EmptyState/EmptyState";

const TabGrid = ({ tabs, userRole, onDeleteTab, onTabClick }) => {
    if (!tabs || tabs.length === 0) {
        return (
            <EmptyState
                icon="🖥️"
                title="No Tabs in This Project"
                message="Collaborative tabs let you work together in real-time. Create one to get started!"
            >
                {(userRole === "owner" || userRole === "editor") && <button className="btn-primary">+ Create a New Tab</button>}
            </EmptyState>
        );
    }

    return (
        <div className={gridStyles.grid}>
            {tabs.map((tab) => (
                <TabCard
                    key={tab.id}
                    tab={tab}
                    onClick={() => onTabClick(tab.id)}
                    onDelete={userRole === "owner" ? () => onDeleteTab(tab.id) : null}
                />
            ))}
        </div>
    );
};

export default TabGrid;
