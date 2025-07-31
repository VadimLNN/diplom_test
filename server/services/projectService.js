const projectRepository = require("../repositories/projectRepository");

class ProjectService {
    async createProject(userId, projectData) {
        // Здесь может быть бизнес-логика:
        // - Проверка, не превысил ли пользователь лимит проектов
        // - Валидация данных (хотя лучше это делать на уровне роутов)
        if (!projectData.name) {
            throw new Error("Project name is required");
        }

        return projectRepository.create({
            ...projectData,
            ownerId: userId,
        });
    }

    async getProjectById(projectId) {
        // Здесь мы пока просто вызываем репозиторий, но в будущем может быть сложная логика
        return projectRepository.findById(projectId);
    }

    async getAllProjectsForUser(userId) {
        return projectRepository.findAllForUser(userId);
    }

    async updateProject(projectId, projectData) {
        // Логика валидации
        if (!projectData.name) {
            throw new Error("Project name is required");
        }
        return projectRepository.update(projectId, projectData);
    }

    async deleteProject(projectId) {
        // Логика перед удалением:
        // - Проверить, есть ли в проекте неоплаченные счета (гипотетически)
        // - Отправить уведомление участникам
        return projectRepository.delete(projectId);
    }
}

module.exports = new ProjectService();
