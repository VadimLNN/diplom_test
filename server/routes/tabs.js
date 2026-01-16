// server/routes/tabs.js
const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();

const pool = require("../db");

const authMiddleware = require("../middleware/authMiddleware");
const tabService = require("../services/tabService"); // ✅ TabService!

router.use(authMiddleware);

// ✅ DELETE — используем сервис
router.delete("/:tabId", authMiddleware, async (req, res) => {
    try {
        await tabService.deleteTab(req.user.id, req.params.tabId);
        res.json({ message: "Tab deleted successfully" });
    } catch (error) {
        if (error.statusCode === 403) {
            return res.status(403).json({ error: error.message });
        }
        if (error.message.includes("not found")) {
            return res.status(404).json({ error: error.message });
        }
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

router.get("/projects/:projectId/tabs/:tabId", async (req, res) => {
    try {
        const { projectId, tabId } = req.params;

        const result = await pool.query(
            `
            SELECT t.*, p.name as project_name 
            FROM tabs t 
            JOIN projects p ON t.project_id = p.id 
            WHERE t.id = $1 AND t.project_id = $2
        `,
            [tabId, projectId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Tab not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Tab fetch error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
