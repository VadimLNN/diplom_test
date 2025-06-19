// middleware/checkProjectAccess.js
const pool = require("../db");

const checkProjectAccess = async (req, res, next) => {
    const projectId = req.params.id || req.params.projectId;
    const userId = req.user.id;

    if (!projectId) return res.status(400).json({ error: "Project ID missing" });

    try {
        const query = `
            SELECT 1 FROM projects p
            LEFT JOIN project_permissions pp ON p.id = pp.project_id
            WHERE p.id = $1 AND (p.owner_id = $2 OR pp.user_id = $2)
        `;
        const result = await pool.query(query, [projectId, userId]);
        if (result.rowCount > 0) return next();
        return res.status(403).json({ error: "Forbidden: No access to this project." });
    } catch (error) {
        return res.status(500).json({ error: "Server error checking access" });
    }
};

module.exports = checkProjectAccess;
