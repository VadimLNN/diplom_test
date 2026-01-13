// server/routes/tabs.js
const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();

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

module.exports = router;
