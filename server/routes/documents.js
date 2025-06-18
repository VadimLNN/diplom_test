const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const passport = require("../middleware/auth");
const logger = require("../utils/logger");

router.get("/projects/:id", passport.authenticate("jwt", { session: false }), async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await pool.query("SELECT * FROM documents WHERE project_id = $1", [id]);
        res.json(rows);
    } catch (error) {
        logger.error("Get documents error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

router.post("/projects/:id", passport.authenticate("jwt", { session: false }), async (req, res) => {
    const { id } = req.params;
    const { title } = req.body;
    try {
        if (!title || typeof title !== "string") return res.status(400).json({ error: "Invalid data: title is required" });
        const { rows } = await pool.query("INSERT INTO documents (project_id, title, owner_id, content) VALUES ($1, $2, $3, $4) RETURNING *", [
            id,
            title,
            req.user.id,
            "",
        ]);
        logger.info(`Document created: ${title} in project ${id} by ${req.user.username}`);
        res.status(201).json(rows[0]);
    } catch (error) {
        logger.error("Create document error:", error);
        res.status(400).json({ error: "Invalid data" });
    }
});

router.put("/:id", passport.authenticate("jwt", { session: false }), async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    try {
        const { rows } = await pool.query("UPDATE documents SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *", [
            title,
            content,
            id,
        ]);
        if (rows.length === 0) return res.status(404).json({ error: "Document not found" });
        logger.info(`Document updated: ${id} by ${req.user.username}`);
        res.json(rows[0]);
    } catch (error) {
        logger.error("Update document error:", error);
        res.status(400).json({ error: "Invalid data" });
    }
});

router.delete("/:id", passport.authenticate("jwt", { session: false }), async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await pool.query("DELETE FROM documents WHERE id = $1 AND owner_id = $2 RETURNING id", [id, req.user.id]);
        if (rows.length === 0) return res.status(403).json({ error: "Not authorized or document not found" });
        logger.info(`Document deleted: ${id} by ${req.user.username}`);
        res.json({ message: "Document deleted" });
    } catch (error) {
        logger.error("Delete document error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
