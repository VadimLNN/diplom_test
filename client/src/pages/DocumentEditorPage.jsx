import { useParams, Link } from "react-router-dom";
// import { CollaborativeEditor } from '../features/document/editor';

const DocumentEditorPage = () => {
    const { documentId } = useParams();
    // const { projectId } = ...; // projectId нужно будет как-то получать

    return (
        <div className="page-container editor-layout">
            <header>
                <p>
                    <Link to="/projects">Проекты</Link> / <Link to={`/projects/1`}>Проект</Link> / Документ {documentId}
                </p>
                <div>Аватарки онлайн-пользователей</div>
            </header>
            <main>
                <p>Здесь будет коллаборативный редактор...</p>
                {/* <CollaborativeEditor documentId={documentId} /> */}
            </main>
        </div>
    );
};

export default DocumentEditorPage;
