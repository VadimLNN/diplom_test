// routes/documents.js

const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const checkProjectAccess = require("../middleware/checkProjectAccess");

router.use(authMiddleware);

// GET /api/documents/project/:projectId
router.get("/project/:projectId", checkProjectAccess, async (req, res) => {
    const { projectId } = req.params;
    try {
        const { rows } = await pool.query("SELECT * FROM documents WHERE project_id = $1 ORDER BY created_at", [projectId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Server error fetching documents" });
    }
});

// GET /api/documents/:id
// router.get("/:id", async (req, res) => {
//     const { id } = req.params; // ID документа
//     const userId = req.user.id; // ID пользователя

//     console.log("--- DEBUG: GET /api/documents/:id ---");
//     console.log(`Document ID to fetch: ${id}`);
//     console.log(`User ID from token: ${userId}`);

//     try {
//         // 1. Получаем документ и ID проекта, в котором он лежит
//         const docResult = await pool.query("SELECT * FROM documents WHERE id = $1", [id]);
//         if (docResult.rows.length === 0) return res.status(404).json({ error: "Document not found" });

//         const document = docResult.rows[0];
//         const projectId = document.project_id; // <-- ID проекта, к которому нужно проверить доступ

//         // 2. Вручную выполняем логику проверки доступа
//         const accessResult = await pool.query(
//             `SELECT 1 FROM projects p
//              LEFT JOIN project_permissions pp ON p.id = pp.project_id
//              WHERE p.id = $1 AND (p.owner_id = $2 OR pp.user_id = $2)`,
//             [projectId, userId]
//         );

//         // 3. Если доступ есть (найдена хотя бы одна строка), отправляем документ
//         if (accessResult.rowCount > 0) {
//             return res.json(document);
//         }

//         // 4. Если доступа нет, возвращаем 403
//         return res.status(403).json({ error: "Forbidden: No access to this document's project." });
//     } catch (error) {
//         console.error(`!!! DATABASE ERROR on GET /documents/${id} !!!`);
//         console.error(error); // Выводим полную ошибку от базы данных
//         res.status(500).json({ error: "Server error fetching document" });
//         console.error("Error fetching document by ID:", error);
//     }
// });

router.get("/:id", async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    console.log(`[1] ENTERED /documents/${id} for user ${userId}`);

    try {
        console.log("[2] Inside TRY block. About to query for document...");

        const docResult = await pool.query("SELECT * FROM documents WHERE id = $1", [id]);

        console.log(`[3] Query for document finished. Found ${docResult.rowCount} rows.`);

        if (docResult.rows.length === 0) {
            console.log("[4a] Document not found. Sending 404.");
            return res.status(404).json({ error: "Document not found" });
        }

        const document = docResult.rows[0];
        const projectId = document.project_id;

        console.log(`[4b] Document found. Belongs to project ${projectId}. About to check access...`);

        const accessResult = await pool.query(
            `SELECT 1 FROM projects p LEFT JOIN project_permissions pp ON p.id = pp.project_id WHERE p.id = $1 AND (p.owner_id = $2 OR pp.user_id = $2)`,
            [projectId, userId]
        );

        console.log(`[5] Access check query finished. Found ${accessResult.rowCount} rows.`);

        if (accessResult.rowCount > 0) {
            console.log("[6a] Access GRANTED. Sending document data.");
            return res.json(document);
        } else {
            console.log("[6b] Access DENIED. Sending 403.");
            return res.status(403).json({ error: "Forbidden: No access to this document's project." });
        }
    } catch (error) {
        console.error(`[!!!] CATCH block executed for /documents/${id}`, error);
        res.status(500).json({ error: "Server error fetching document" });
    }
});

// POST /api/documents/project/:projectId
router.post("/project/:projectId", checkProjectAccess, async (req, res) => {
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

// PUT /api/documents/:id
router.put("/:id", async (req, res) => {
    const { id } = req.params; // ID документа
    const userId = req.user.id; // ID пользователя
    const { title, content } = req.body;
    if (title === undefined && content === undefined) return res.status(400).json({ error: "Nothing to update" });

    try {
        // 1. Получаем документ и ID проекта
        const docResult = await pool.query("SELECT * FROM documents WHERE id = $1", [id]);
        if (docResult.rows.length === 0) return res.status(404).json({ error: "Document not found" });

        const document = docResult.rows[0];
        const projectId = document.project_id;

        // 2. Проверяем доступ
        const accessResult = await pool.query(
            `SELECT 1 FROM projects p
             LEFT JOIN project_permissions pp ON p.id = pp.project_id
             WHERE p.id = $1 AND (p.owner_id = $2 OR pp.user_id = $2)`,
            // TODO: Для PUT можно добавить проверку роли, чтобы viewer не мог редактировать
            [projectId, userId]
        );
        if (accessResult.rowCount === 0) {
            return res.status(403).json({ error: "Forbidden: No access to update this document." });
        }

        // 3. Если доступ есть, обновляем
        const newTitle = title !== undefined ? title : document.title;
        const newContent = content !== undefined ? content : document.content;
        const { rows } = await pool.query("UPDATE documents SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *", [
            newTitle,
            newContent,
            id,
        ]);
        res.json(rows[0]);
    } catch (error) {
        console.error("Error updating document:", error);
        res.status(500).json({ error: "Update failed" });
    }
});

// DELETE /api/documents/:id
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const docResult = await pool.query("SELECT project_id FROM documents WHERE id = $1", [id]);
        if (docResult.rows.length === 0) return res.status(404).json({ error: "Document not found" });

        req.params.projectId = docResult.rows[0].project_id;
        checkProjectAccess(req, res, async () => {
            await pool.query("DELETE FROM documents WHERE id = $1", [id]);
            res.status(204).send();
        });
    } catch (error) {
        res.status(500).json({ error: "Delete failed" });
    }
});

module.exports = router;
