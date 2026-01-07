const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const projectAccess = require("../middleware/checkProjectAccess");
const tabsService = require("../services/tabsService");

// ===============================
// Create tab
// POST /projects/:projectId/tabs
// ===============================
router.post("/projects/:projectId/tabs", auth, projectAccess, async (req, res) => {
    try {
        const { projectId } = req.params;
        const { type, title } = req.body;

        if (!type || !title) {
            return res.status(400).json({ error: "type and title are required" });
        }

        const tab = await tabsService.createTab({
            projectId,
            type,
            title,
        });

        res.json(tab);
    } catch (err) {
        console.error("Create tab error:", err);
        res.status(500).json({ error: "Failed to create tab" });
    }
});

// ===============================
// Get tabs by project
// GET /projects/:projectId/tabs
// ===============================
router.get("/projects/:projectId/tabs", auth, projectAccess, async (req, res) => {
    try {
        const { projectId } = req.params;
        const tabs = await tabsService.getTabsByProject(projectId);
        res.json(tabs);
    } catch (err) {
        console.error("Get tabs error:", err);
        res.status(500).json({ error: "Failed to load tabs" });
    }
});

// ===============================
// Delete tab
// DELETE /tabs/:tabId
// ===============================
router.delete("/tabs/:tabId", auth, async (req, res) => {
    try {
        const { tabId } = req.params;
        await tabsService.deleteTab(tabId);
        res.json({ ok: true });
    } catch (err) {
        console.error("Delete tab error:", err);
        res.status(500).json({ error: "Failed to delete tab" });
    }
});

module.exports = router;
