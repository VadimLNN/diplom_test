const pool = require("../db");

class PermissionRepository {
    async findMembers(projectId) {
        const { rows } = await pool.query(
            `SELECT u.id, u.username, u.email, pp.role 
             FROM users u 
             JOIN project_permissions pp ON u.id = pp.user_id 
             WHERE pp.project_id = $1`,
            [projectId]
        );
        return rows;
    }

    async add(projectId, userId, role) {
        const { rows } = await pool.query("INSERT INTO project_permissions (project_id, user_id, role) VALUES ($1, $2, $3) RETURNING *", [
            projectId,
            userId,
            role,
        ]);
        return rows[0];
    }

    async remove(projectId, userId) {
        await pool.query("DELETE FROM project_permissions WHERE project_id = $1 AND user_id = $2", [projectId, userId]);
    }
}

module.exports = new PermissionRepository();
