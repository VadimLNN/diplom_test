// services/permissionService.js
const permissionRepository = require("../repositories/permissionRepository");
const userRepository = require("../repositories/userRepository"); // Нам понадобится для поиска по email
const projectRepository = require("../repositories/projectRepository"); // Для проверки владельца

const { getUserRoleInProject } = require("../middleware/checkRole");

class PermissionService {
    async getProjectMembers(projectId) {
        const members = await permissionRepository.findMembers(projectId);
        const owner = await projectRepository.findById(projectId);

        // Получаем полные данные о владельце и добавляем ему роль 'owner'
        const ownerInfo = await userRepository.findById(owner.owner_id);
        const ownerAsMember = { ...ownerInfo, role: "owner" };

        // Объединяем и убираем дубликаты
        const membersMap = new Map();
        [ownerAsMember, ...members].forEach((member) => {
            membersMap.set(member.id, member);
        });

        return Array.from(membersMap.values());
    }

    async getUserRole(userId, projectId) {
        // Сервисный метод просто вызывает и возвращает результат
        // нашей основной функции. Это сохраняет правильную архитектуру.
        return getUserRoleInProject(userId, projectId);
    }

    async inviteUser(projectId, inviterId, { email, role }) {
        if (!email || !role || !["editor", "viewer"].includes(role)) {
            const error = new Error("User email and a valid role ('editor' or 'viewer') are required");
            error.statusCode = 400;
            throw error;
        }

        const userToInvite = await userRepository.findByEmail(email); // Предполагаем, что этот метод будет в userRepository
        if (!userToInvite) {
            const error = new Error("User with this email not found");
            error.statusCode = 404;
            throw error;
        }

        const project = await projectRepository.findById(projectId);
        if (project.owner_id === userToInvite.id) {
            const error = new Error("Cannot invite the project owner.");
            error.statusCode = 400;
            throw error;
        }

        try {
            return await permissionRepository.add(projectId, userToInvite.id, role);
        } catch (error) {
            if (error.code === "23505") {
                // unique_violation
                const customError = new Error("This user already has access to the project.");
                customError.statusCode = 409;
                throw customError;
            }
            throw error; // Перебрасываем другие ошибки
        }
    }

    async removeUser(projectId, userIdToRemove) {
        const project = await projectRepository.findById(projectId);
        if (String(project.owner_id) === String(userIdToRemove)) {
            const error = new Error("Project owner cannot be removed.");
            error.statusCode = 400;
            throw error;
        }
        return permissionRepository.remove(projectId, userIdToRemove);
    }
}

module.exports = new PermissionService();
