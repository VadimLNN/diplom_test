import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";

// FSD: Импортируем из shared слоя
import api from "../../shared/api/axios"; // Убедитесь, что путь к вашему настроенному axios верный

// FSD: Импортируем из features слоя
import ProjectMembers from "../../features/document-editor/ui/ProjectMembers";
import CollaborativeEditor from "../../features/document-editor/ui/CollaborativeEditor";

const ProjectPage = () => {
    const { projectId } = useParams();

    // Состояния для данных
    const [project, setProject] = useState(null);
    const [documents, setDocuments] = useState([]);

    // Состояния для UI
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [newDocumentTitle, setNewDocumentTitle] = useState("");

    // --- Загрузка данных ---
    const fetchProjectData = useCallback(async () => {
        setIsLoading(true);
        setError("");
        try {
            // Загружаем данные о проекте и его документы параллельно для скорости
            const [projectResponse, documentsResponse] = await Promise.all([
                api.get(`/projects/${projectId}`),
                api.get(`/documents/project/${projectId}`),
            ]);
            setProject(projectResponse.data);
            setDocuments(documentsResponse.data);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to fetch project data. You may not have access.");
            console.error("Fetch error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchProjectData();
    }, [fetchProjectData]);

    // --- CRUD операции для документов ---
    const handleCreateDocument = async (e) => {
        e.preventDefault();
        if (!newDocumentTitle.trim()) {
            setError("Document title is required.");
            return;
        }
        try {
            const response = await api.post(
                `/documents/project/${projectId}`,
                { title: newDocumentTitle, content: "Start typing here..." } // Или просто " "
            );
            setDocuments([...documents, response.data]);
            setNewDocumentTitle(""); // Очищаем поле ввода
        } catch (err) {
            setError(err.response?.data?.error || "Failed to create document.");
        }
    };

    const handleDeleteDocument = async (documentId) => {
        // Добавим подтверждение для такой опасной операции
        if (window.confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
            try {
                await api.delete(`/documents/${documentId}`);
                setDocuments(documents.filter((doc) => doc.id !== documentId));
                if (selectedDocument?.id === documentId) {
                    setSelectedDocument(null); // Если удалили открытый документ, закрываем редактор
                }
            } catch (err) {
                setError(err.response?.data?.error || "Failed to delete document.");
            }
        }
    };

    const handleSaveDocument = (documentId, updatedContent) => {
        // Эта функция будет передана в редактор для автосохранения
        // Она обновляет состояние локально, чтобы UI был отзывчивым
        const updatedDocuments = documents.map((doc) => (doc.id === documentId ? { ...doc, content: updatedContent } : doc));
        setDocuments(updatedDocuments);

        // Отправляем запрос на сервер в фоне
        api.put(`/documents/${documentId}`, { content: updatedContent }).catch((err) => {
            console.error("Autosave failed:", err);
            setError("Failed to save changes. Please check your connection.");
            // Можно добавить логику для отката изменений, если сохранение не удалось
        });
    };

    // --- Рендеринг ---
    if (isLoading) {
        return (
            <div className="container">
                <h2>Loading Project...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container">
                <div className="message error">{error}</div>
            </div>
        );
    }

    return (
        <div className="container">
            <h1>Project: {project?.name}</h1>
            <p>{project?.description}</p>

            <hr />

            {/* --- Блок управления участниками --- */}
            <ProjectMembers projectId={projectId} />

            <hr />

            {/* --- Блок создания и списка документов --- */}
            <div className="documents-section">
                <h2>Documents</h2>
                <div className="card">
                    <h3>Create New Document</h3>
                    <form onSubmit={handleCreateDocument} className="form">
                        <input
                            value={newDocumentTitle}
                            onChange={(e) => setNewDocumentTitle(e.target.value)}
                            placeholder="New document title"
                            required
                        />
                        <button type="submit" className="btn btn-primary">
                            Create
                        </button>
                    </form>
                </div>

                <div className="document-grid">
                    {documents.length > 0 ? (
                        documents.map((doc) => (
                            <div key={doc.id} className="card document-card">
                                <h3>{doc.title}</h3>
                                <p>{doc.content ? `${doc.content.substring(0, 50)}...` : "Empty document"}</p>
                                <div className="document-actions">
                                    <button className="btn btn-secondary" onClick={() => setSelectedDocument(doc)}>
                                        Open Editor
                                    </button>
                                    <button className="btn btn-danger" onClick={() => handleDeleteDocument(doc.id)}>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No documents in this project yet. Create one!</p>
                    )}
                </div>
            </div>

            {/* --- Редактор для выбранного документа --- */}
            {selectedDocument && (
                <div className="card editor-modal-backdrop">
                    <div className="editor-modal-content">
                        <div className="editor-header">
                            <h2>Editing: {selectedDocument.title}</h2>
                            <button className="btn btn-close" onClick={() => setSelectedDocument(null)}>
                                ×
                            </button>
                        </div>
                        <CollaborativeEditor
                            key={selectedDocument.id} // Важно! `key` заставит редактор пересоздаться при выборе другого документа
                            documentId={selectedDocument.id}
                            initialContent={selectedDocument.content}
                            onSave={handleSaveDocument}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(ProjectPage);
