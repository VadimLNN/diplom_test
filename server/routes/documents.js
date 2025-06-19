const express = require("express");
const router = express.Router();
const pool = require("../db");
const passport = require("passport");

router.get("/project/:projectId", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const { projectId } = req.params;
        console.log(`Checking project ${projectId} for user ${req.user.id}`); // Отладка
        const projectCheck = await pool.query("SELECT 1 FROM projects WHERE id = $1 AND owner_id = $2", [projectId, req.user.id]);
        if (projectCheck.rowCount === 0) {
            console.log("Project not found or unauthorized");
            return res.status(404).json({ error: "Project not found or unauthorized" });
        }

        const { rows } = await pool.query("SELECT * FROM documents WHERE project_id = $1 AND owner_id = $2", [projectId, req.user.id]);
        res.json(rows);
    } catch (error) {
        console.error("Get documents error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

router.post("/project/:projectId", passport.authenticate("jwt", { session: false }), async (req, res) => {
    const { projectId } = req.params;
    const { title, content } = req.body;
    console.log(`Creating document for project ${projectId}, data:`, req.body); // Отладка
    try {
        const projectCheck = await pool.query("SELECT 1 FROM projects WHERE id = $1 AND owner_id = $2", [projectId, req.user.id]);
        if (projectCheck.rowCount === 0) {
            console.log("Project not found or unauthorized during creation");
            return res.status(404).json({ error: "Project not found or unauthorized" });
        }

        if (!title) {
            return res.status(400).json({ error: "Document title is required" });
        }

        const { rows } = await pool.query(
            "INSERT INTO documents (project_id, title, content, owner_id, created_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING *",
            [projectId, title, content, req.user.id]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error("Create document error:", error);
        res.status(400).json({ error: "Creation failed" });
    }
});

router.put("/:id", passport.authenticate("jwt", { session: false }), async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    try {
        const { rows } = await pool.query(
            "UPDATE documents SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND owner_id = $4 RETURNING *",
            [title, content, id, req.user.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: "Document not found or unauthorized" });
        res.json(rows[0]);
    } catch (error) {
        console.error("Update document error:", error);
        res.status(400).json({ error: "Update failed" });
    }
});

router.delete("/:id", passport.authenticate("jwt", { session: false }), async (req, res) => {
    const { id } = req.params;
    try {
        const { rowCount } = await pool.query("DELETE FROM documents WHERE id = $1 AND owner_id = $2", [id, req.user.id]);
        if (rowCount === 0) return res.status(404).json({ error: "Document not found or unauthorized" });
        res.status(204).send();
    } catch (error) {
        console.error("Delete document error:", error);
        res.status(500).json({ error: "Deletion failed" });
    }
});

module.exports = router;
