const pool = require("../db");

/**
 * Вспомогательная функция для получения роли пользователя в проекте.
 * Возвращает 'owner', 'editor', 'viewer' или null.
 */
const getUserRoleInProject = async (userId, projectId) => {
    // Добавим проверку на входе для надежности
    if (!userId || !projectId) {
        throw new Error("User ID or Project ID is missing");
    }
    try {
        const ownerCheck = await pool.query("SELECT owner_id FROM projects WHERE id = $1", [projectId]);
        if (ownerCheck.rows.length > 0 && ownerCheck.rows[0].owner_id == userId) {
            return "owner";
        }
        const permissionCheck = await pool.query("SELECT role FROM project_permissions WHERE project_id = $1 AND user_id = $2", [projectId, userId]);
        if (permissionCheck.rows.length > 0) {
            return permissionCheck.rows[0].role;
        }
        return null; // Роль просто не найдена, это не ошибка
    } catch (error) {
        console.error("Database Error in getUserRoleInProject:", error);
        // А вот это - ошибка, и о ней нужно сообщить
        throw error;
    }
};

/**
 * Middleware-генератор для проверки, входит ли роль пользователя в разрешенный список.
 * Используется после checkProjectAccess.
 */
const hasRole = (allowedRoles) => {
    return async (req, res, next) => {
        const projectId = req.params.id || req.params.projectId;
        const userId = req.user.id;

        const userRole = await getUserRoleInProject(userId, projectId);

        if (userRole && allowedRoles.includes(userRole)) {
            return next(); // Роль подходит, продолжаем
        }

        return res.status(403).json({ error: "Forbidden: You do not have the required role for this action." });
    };
};

module.exports = { hasRole, getUserRoleInProject };
