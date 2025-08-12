// middleware/checkProjectAccess.js
const pool = require("../db");

const checkProjectAccess = async (req, res, next) => {
    // Эта часть остается без изменений
    const projectId = req.params.id || req.params.projectId;
    const userId = req.user.id;
    if (!projectId) return res.status(400).json({ error: "Project ID missing" });

    try {
        // --- ЗАМЕНЯЕМ ЗАПРОС НА БОЛЕЕ НАДЕЖНЫЙ ---
        const query = `
            (SELECT 1 FROM projects WHERE id = $1 AND owner_id = $2)
            UNION
            (SELECT 1 FROM project_permissions WHERE project_id = $1 AND user_id = $2)
        `;
        const result = await pool.query(query, [projectId, userId]);

        if (result.rowCount > 0) {
            return next(); // Доступ есть
        }

        return res.status(403).json({ error: "Forbidden: No access to this project." });
    } catch (error) {
        console.error(`Access check failed for user ${userId} on project ${projectId}:`, error);
        return res.status(500).json({ error: "Server error checking access" });
    }
};

module.exports = checkProjectAccess;
