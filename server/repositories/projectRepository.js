const pool = require("../db");

class ProjectRepository {
    async create({ name, description, ownerId }) {
        const { rows } = await pool.query("INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *", [
            name,
            description,
            ownerId,
        ]);
        return rows[0];
    }

    async findById(projectId) {
        const { rows } = await pool.query("SELECT * FROM projects WHERE id = $1", [projectId]);
        return rows[0];
    }

    async findAllForUser(userId) {
        const query = `
            SELECT DISTINCT p.*
            FROM projects p
            LEFT JOIN project_permissions pp ON p.id = pp.project_id
            WHERE p.owner_id = $1 OR pp.user_id = $1
            ORDER BY p.created_at DESC;
        `;
        const { rows } = await pool.query(query, [userId]);
        return rows;
    }

    async update(projectId, { name, description }) {
        const { rows } = await pool.query("UPDATE projects SET name = $1, description = $2 WHERE id = $3 RETURNING *", [
            name,
            description,
            projectId,
        ]);
        return rows[0];
    }

    async delete(projectId) {
        await pool.query("DELETE FROM projects WHERE id = $1", [projectId]);
        return true;
    }
}

// Экспортируем один экземпляр класса, чтобы не создавать его каждый раз (Singleton)
module.exports = new ProjectRepository();
