const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

// CREATE - Создание нового проекта
router.post("/", async (req, res) => {
    const { name, description } = req.body;

    const ownerId = req.user.id;

    if (!name) {
        return res.status(400).json({ error: "Project name is required" });
    }

    try {
        const newProject = await pool.query("INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *", [
            name,
            description,
            ownerId,
        ]);
        res.status(201).json(newProject.rows[0]);
    } catch (error) {
        console.error("Create project error:", error.stack);
        res.status(500).json({ error: "Failed to create project" });
    }
});

// READ - Получение всех проектов ТЕКУЩЕГО пользователя
router.get("/", async (req, res) => {
    const ownerId = req.user.id; // <-- ID пользователя для фильтрации

    try {
        // Добавляем `WHERE owner_id = $1`
        const result = await pool.query("SELECT * FROM projects WHERE owner_id = $1 ORDER BY created_at DESC", [ownerId]);
        res.json(result.rows);
    } catch (error) {
        console.error("Get all projects error:", error.stack);
        res.status(500).json({ error: "Failed to fetch projects" });
    }
});

// READ - Получение одного проекта по ID (с проверкой владения)
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    const ownerId = req.user.id;

    try {
        const result = await pool.query("SELECT * FROM projects WHERE id = $1 AND owner_id = $2", [id, ownerId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Project not found or you do not have permission to view it" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(`Get project by id=${id} error:`, error.stack);
        res.status(500).json({ error: "Failed to fetch project" });
    }
});

// UPDATE - Обновление проекта по ID (с проверкой владения)
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const ownerId = req.user.id;
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ error: "Project name is required" });
    }

    try {
        const updatedProject = await pool.query("UPDATE projects SET name = $1, description = $2 WHERE id = $3 AND owner_id = $4 RETURNING *", [
            name,
            description,
            id,
            ownerId,
        ]);

        if (updatedProject.rowCount === 0) {
            return res.status(404).json({ error: "Project not found or you do not have permission to edit it" });
        }

        res.json(updatedProject.rows[0]);
    } catch (error) {
        console.error(`Update project id=${id} error:`, error.stack);
        res.status(500).json({ error: "Failed to update project" });
    }
});

// DELETE - Удаление проекта по ID (с проверкой владения)
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const ownerId = req.user.id;

    try {
        const deleteOp = await pool.query("DELETE FROM projects WHERE id = $1 AND owner_id = $2 RETURNING *", [id, ownerId]);

        if (deleteOp.rowCount === 0) {
            return res.status(404).json({ error: "Project not found or you do not have permission to delete it" });
        }

        // Возвращаем сообщение об успехе. Можно вернуть и удаленный объект, если нужно.
        res.status(200).json({ message: "Project deleted successfully" });
    } catch (error) {
        console.error(`Delete project id=${id} error:`, error.stack);
        res.status(500).json({ error: "Failed to delete project" });
    }
});

module.exports = router;
