// import { ProjectGrid } from '../widgets/ProjectGrid'; // Будет позже
// import { RecentDocuments } from '../widgets/RecentDocuments'; // Будет позже
// import { Header } from '../widgets/Header'; // Будет позже

const ProjectsDashboardPage = () => {
    return (
        <div className="page-container">
            {/* <Header /> */}
            <h2>Мои Проекты</h2>
            <button>+ Создать проект</button>
            <div style={{ display: "flex", gap: "20px" }}>
                <div style={{ flex: 3 }}>
                    <p>Здесь будет сетка проектов...</p>
                    {/* <ProjectGrid /> */}
                </div>
                <div style={{ flex: 1, borderLeft: "1px solid #ccc", paddingLeft: "20px" }}>
                    <h3>Последние документы</h3>
                    <p>Здесь будет список последних документов...</p>
                    {/* <RecentDocuments /> */}
                </div>
            </div>
        </div>
    );
};

export default ProjectsDashboardPage;
