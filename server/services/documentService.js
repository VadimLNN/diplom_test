const documentRepository = require("../repositories/documentRepository");
const { getUserRoleInProject } = require("../middleware/checkRole"); // Импортируем нашу полезную функцию

class DocumentService {
    async getDocumentsForProject(projectId) {
        return documentRepository.findByProjectId(projectId);
    }

    async getDocumentById(documentId) {
        return documentRepository.findById(documentId);
    }

    async createDocument(userId, projectId, documentData) {
        if (!documentData.title) {
            throw new Error("Title is required");
        }
        return documentRepository.create({
            ...documentData,
            projectId: projectId,
            ownerId: userId,
        });
    }

    async updateDocument(userId, documentId, documentData) {
        const document = await documentRepository.findById(documentId);
        if (!document) {
            throw new Error("Document not found");
        }

        // Бизнес-логика: проверка роли перед обновлением
        const userRole = await getUserRoleInProject(userId, document.project_id);
        if (!["owner", "editor"].includes(userRole)) {
            // Создаем ошибку с определенным статусом, чтобы роутер мог ее правильно обработать
            const error = new Error("Forbidden: You do not have permission to edit this document.");
            error.statusCode = 403;
            throw error;
        }

        // Обновляем только те поля, которые пришли
        const newTitle = documentData.title !== undefined ? documentData.title : document.title;
        const newContent = documentData.content !== undefined ? documentData.content : document.content;

        return documentRepository.update(documentId, { title: newTitle, content: newContent });
    }

    async deleteDocument(userId, documentId) {
        const document = await documentRepository.findById(documentId);
        if (!document) {
            throw new Error("Document not found");
        }

        // Бизнес-логика: проверка роли перед удалением
        const userRole = await getUserRoleInProject(userId, document.project_id);
        if (!["owner", "editor"].includes(userRole)) {
            const error = new Error("Forbidden: You do not have permission to delete this document.");
            error.statusCode = 403;
            throw error;
        }

        return documentRepository.delete(documentId);
    }
}

module.exports = new DocumentService();
