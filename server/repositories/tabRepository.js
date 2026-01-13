// server/repositories/tabRepository.js
const pool = require("../db");
const { v4: uuidv4 } = require("uuid");

class TabRepository {
    // ✅ Аналог findByProjectId
    async findByProjectId(projectId) {
        const { rows } = await pool.query(
            `SELECT id, title, type, ydoc_document_name, created_at, updated_at 
             FROM tabs WHERE project_id = $1 ORDER BY created_at ASC`,
            [projectId]
        );
        return rows;
    }

    // ✅ Аналог findById
    async findById(tabId) {
        const { rows } = await pool.query(
            `SELECT id, title, type, ydoc_document_name, project_id, created_at, updated_at 
             FROM tabs WHERE id = $1`,
            [tabId]
        );
        return rows[0];
    }

    // ✅ Аналог create — теперь с Y.Doc!
    async create({ projectId, title, type, ownerId }) {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            const tabId = uuidv4();
            const ydocDocumentName = `tab.${tabId}`;

            // 1. Создаём tab
            const { rows: tabRows } = await client.query(
                `INSERT INTO tabs (id, project_id, title, type, ydoc_document_name, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
                [tabId, projectId, title, type, ydocDocumentName]
            );

            // 2. Создаём пустой Y.Doc
            const emptyYdoc = Buffer.from([0]);
            await client.query(
                `INSERT INTO yjs_documents (ydoc_document_name, ydoc_data, created_at, updated_at)
                 VALUES ($1, $2, NOW(), NOW())`,
                [ydocDocumentName, emptyYdoc]
            );

            await client.query("COMMIT");
            return tabRows[0];
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    // ✅ Аналог update
    async update(tabId, { title, type }) {
        const { rows } = await pool.query(
            `UPDATE tabs 
             SET title = $1, type = $2, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $3 RETURNING *`,
            [title, type, tabId]
        );
        return rows[0];
    }

    // ✅ Аналог delete
    async delete(tabId) {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Получаем ydoc_document_name перед удалением
            const { rows } = await client.query(`DELETE FROM tabs WHERE id = $1 RETURNING ydoc_document_name`, [tabId]);

            // Y.Doc удаляется каскадом через FOREIGN KEY
            await client.query("COMMIT");
            return rows.length > 0;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = new TabRepository();
