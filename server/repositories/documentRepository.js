const pool = require("../db");

class DocumentRepository {
    async findByProjectId(projectId) {
        const { rows } = await pool.query("SELECT * FROM documents WHERE project_id = $1 ORDER BY created_at", [projectId]);
        return rows;
    }

    async findById(documentId) {
        const { rows } = await pool.query("SELECT * FROM documents WHERE id = $1", [documentId]);
        return rows[0];
    }

    async create({ projectId, title, content, ownerId }) {
        const { rows } = await pool.query("INSERT INTO documents (project_id, title, content, owner_id) VALUES ($1, $2, $3, $4) RETURNING *", [
            projectId,
            title,
            content,
            ownerId,
        ]);
        return rows[0];
    }

    async update(documentId, { title, content }) {
        const { rows } = await pool.query("UPDATE documents SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *", [
            title,
            content,
            documentId,
        ]);
        return rows[0];
    }

    async delete(documentId) {
        await pool.query("DELETE FROM documents WHERE id = $1", [documentId]);
    }
}

module.exports = new DocumentRepository();
