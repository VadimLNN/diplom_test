// server/services/tabService.js
const tabRepository = require("../repositories/tabRepository");
const { getUserRoleInProject } = require("../middleware/checkRole");

class TabService {
    // ✅ Аналог getDocumentsForProject
    async getTabsForProject(projectId) {
        return tabRepository.findByProjectId(projectId);
    }

    // ✅ Аналог getDocumentById
    async getTabById(tabId) {
        return tabRepository.findById(tabId);
    }

    // ✅ Аналог createDocument — теперь с type!
    async createTab(userId, projectId, tabData) {
        if (!tabData.title) {
            throw new Error("Title is required");
        }
        if (!["text", "board", "code", "mindmap"].includes(tabData.type)) {
            throw new Error("Invalid tab type. Must be: text, board, code, or mindmap");
        }

        return tabRepository.create({
            ...tabData,
            projectId: projectId,
            ownerId: userId,
        });
    }

    // ✅ Аналог updateDocument
    async updateTab(userId, tabId, tabData) {
        const tab = await tabRepository.findById(tabId);
        if (!tab) {
            throw new Error("Tab not found");
        }

        // Бизнес-логика: проверка роли перед обновлением
        const userRole = await getUserRoleInProject(userId, tab.project_id);
        if (!["owner", "editor"].includes(userRole)) {
            const error = new Error("Forbidden: You do not have permission to edit this tab.");
            error.statusCode = 403;
            throw error;
        }

        // Обновляем только те поля, которые пришли
        const newTitle = tabData.title !== undefined ? tabData.title : tab.title;
        const newType = tabData.type !== undefined ? tabData.type : tab.type;

        return tabRepository.update(tabId, {
            title: newTitle,
            type: newType,
        });
    }

    // ✅ Аналог deleteDocument
    async deleteTab(userId, tabId) {
        const tab = await tabRepository.findById(tabId);
        if (!tab) {
            throw new Error("Tab not found");
        }

        // Бизнес-логика: проверка роли перед удалением
        const userRole = await getUserRoleInProject(userId, tab.project_id);
        if (userRole !== "owner") {
            // Только владелец проекта может удалять
            const error = new Error("Forbidden: Only project owners can delete tabs.");
            error.statusCode = 403;
            throw error;
        }

        return tabRepository.delete(tabId);
    }
}

module.exports = new TabService();
