const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const checkProjectAccess = require("../middleware/checkProjectAccess");

router.use(authMiddleware);

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

router.get("/", authMiddleware, async (req, res) => {
    // Убедитесь, что используете ваш authMiddleware
    const userId = req.user.id;

    try {
        const query = `
            SELECT DISTINCT p.*
            FROM projects p
            LEFT JOIN project_permissions pp ON p.id = pp.project_id
            WHERE p.owner_id = $1 OR pp.user_id = $1
            ORDER BY p.created_at DESC;
        `;
        const result = await pool.query(query, [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error("Get all user projects error:", error.stack);
        res.status(500).json({ error: "Failed to fetch projects" });
    }
});

const projectSpecificMiddlewares = [checkProjectAccess];

router.get("/:id", projectSpecificMiddlewares, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("SELECT * FROM projects WHERE id = $1", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Project not found." });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(`Get project by id=${id} error:`, error.stack);
        res.status(500).json({ error: "Failed to fetch project" });
    }
});

router.put("/:id", projectSpecificMiddlewares, async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    if (!name) {
        return res.status(400).json({ error: "Project name is required" });
    }
    try {
        const updatedProject = await pool.query("UPDATE projects SET name = $1, description = $2 WHERE id = $3 RETURNING *", [name, description, id]);
        res.json(updatedProject.rows[0]);
    } catch (error) {
        console.error(`Update project id=${id} error:`, error.stack);
        res.status(500).json({ error: "Failed to update project" });
    }
});

router.delete("/:id", projectSpecificMiddlewares, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM projects WHERE id = $1", [id]);
        res.status(200).json({ message: "Project deleted successfully" });
    } catch (error) {
        console.error(`Delete project id=${id} error:`, error.stack);
        res.status(500).json({ error: "Failed to delete project" });
    }
});

module.exports = router;
