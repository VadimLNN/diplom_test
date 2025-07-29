const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const checkProjectAccess = require("../middleware/checkProjectAccess");
const { hasRole, getUserRoleInProject } = require("../middleware/checkRole");

router.use(authMiddleware);

// GET /api/documents/project/:projectId - Получить все документы (все участники)
router.get("/project/:projectId", checkProjectAccess, async (req, res) => {
    const { projectId } = req.params;
    try {
        const { rows } = await pool.query("SELECT * FROM documents WHERE project_id = $1 ORDER BY created_at", [projectId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Server error fetching documents" });
    }
});

// GET /api/documents/:id - Получить один документ (все участники)
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const docResult = await pool.query("SELECT * FROM documents WHERE id = $1", [id]);
        if (docResult.rows.length === 0) return res.status(404).json({ error: "Document not found" });

        req.params.projectId = docResult.rows[0].project_id;
        checkProjectAccess(req, res, () => res.json(docResult.rows[0]));
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// POST /api/documents/project/:projectId - Создать документ (owner, editor)
router.post("/project/:projectId", [checkProjectAccess, hasRole(["owner", "editor"])], async (req, res) => {
    const { projectId } = req.params;
    const { title, content } = req.body;
    if (!title) return res.status(400).json({ error: "Title is required" });
    try {
        const { rows } = await pool.query("INSERT INTO documents (project_id, title, content, owner_id) VALUES ($1, $2, $3, $4) RETURNING *", [
            projectId,
            title,
            content || "",
            req.user.id,
        ]);
        res.status(201).json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: "Creation failed" });
    }
});

// PUT /api/documents/:id - Обновить документ (owner, editor)
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, content } = req.body;
    if (title === undefined && content === undefined) return res.status(400).json({ error: "Nothing to update" });

    try {
        const docResult = await pool.query("SELECT * FROM documents WHERE id = $1", [id]);
        if (docResult.rows.length === 0) return res.status(404).json({ error: "Document not found" });

        const document = docResult.rows[0];
        const projectId = document.project_id;

        // Проверяем роль вручную, т.к. projectId получаем по ходу дела
        const userRole = await getUserRoleInProject(userId, projectId);
        if (!["owner", "editor"].includes(userRole)) {
            return res.status(403).json({ error: "Forbidden: You do not have permission to edit this document." });
        }

        const newTitle = title !== undefined ? title : document.title;
        const newContent = content !== undefined ? content : document.content;
        const { rows } = await pool.query("UPDATE documents SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *", [
            newTitle,
            newContent,
            id,
        ]);
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: "Update failed" });
    }
});

// DELETE /api/documents/:id - Удалить документ (owner, editor)
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const docResult = await pool.query("SELECT project_id FROM documents WHERE id = $1", [id]);
        if (docResult.rows.length === 0) return res.status(404).json({ error: "Document not found" });

        const projectId = docResult.rows[0].project_id;

        const userRole = await getUserRoleInProject(userId, projectId);
        if (!["owner", "editor"].includes(userRole)) {
            return res.status(403).json({ error: "Forbidden: You do not have permission to delete this document." });
        }

        await pool.query("DELETE FROM documents WHERE id = $1", [id]);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: "Delete failed" });
    }
});

module.exports = router;
