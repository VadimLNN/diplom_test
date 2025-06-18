const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const passport = require("../middleware/auth");
const logger = require("../utils/logger");

router.get("/", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT p.* FROM projects p
             LEFT JOIN project_permissions pp ON p.id = pp.project_id
             WHERE p.owner_id = $1 OR pp.user_id = $1`,
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        logger.error("Get projects error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

router.post("/", passport.authenticate("jwt", { session: false }), async (req, res) => {
    const { name, description } = req.body;
    try {
        if (!name) return res.status(400).json({ error: "Name is required" });
        await pool.query("BEGIN");
        const { rows } = await pool.query("INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *", [
            name,
            description,
            req.user.id,
        ]);
        await pool.query("INSERT INTO project_permissions (user_id, project_id, role) VALUES ($1, $2, $3)", [req.user.id, rows[0].id, "owner"]);
        await pool.query("COMMIT");
        logger.info(`Project created: ${name} by ${req.user.username}`);
        res.status(201).json(rows[0]);
    } catch (error) {
        await pool.query("ROLLBACK");
        logger.error("Create project error:", error);
        res.status(400).json({ error: "Invalid data" });
    }
});

router.put("/:id", passport.authenticate("jwt", { session: false }), async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    try {
        const { rows } = await pool.query("UPDATE projects SET name = $1, description = $2 WHERE id = $3 AND owner_id = $4 RETURNING *", [
            name,
            description,
            id,
            req.user.id,
        ]);
        if (rows.length === 0) return res.status(403).json({ error: "Not authorized or project not found" });
        logger.info(`Project updated: ${id} by ${req.user.username}`);
        res.json(rows[0]);
    } catch (error) {
        logger.error("Update project error:", error);
        res.status(400).json({ error: "Invalid data" });
    }
});

router.delete("/:id", passport.authenticate("jwt", { session: false }), async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await pool.query("DELETE FROM projects WHERE id = $1 AND owner_id = $2 RETURNING id", [id, req.user.id]);
        if (rows.length === 0) return res.status(403).json({ error: "Not authorized or project not found" });
        logger.info(`Project deleted: ${id} by ${req.user.username}`);
        res.json({ message: "Project deleted" });
    } catch (error) {
        logger.error("Delete project error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

router.get("/all", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM projects");
        res.json(rows);
    } catch (error) {
        logger.error("Fetch all projects error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
