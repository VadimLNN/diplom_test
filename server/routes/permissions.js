const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router({ mergeParams: true });

const authMiddleware = require("../middleware/authMiddleware");
const checkProjectAccess = require("../middleware/checkProjectAccess");
const { hasRole } = require("../middleware/checkRole");

const permissionService = require("../services/permissionService");

router.use(authMiddleware);

// GET / - Получить список участников
router.get("/", checkProjectAccess, async (req, res) => {
    try {
        const members = await permissionService.getProjectMembers(req.params.projectId);
        res.json(members);
    } catch (error) {
        console.error("Route error fetching members:", error);
        res.status(500).json({ error: "Failed to fetch project members" });
    }
});

// GET /my-role - Получить свою роль
router.get("/my-role", checkProjectAccess, async (req, res) => {
    try {
        const role = await permissionService.getUserRole(req.user.id, req.params.projectId);
        res.json({ role });
    } catch (error) {
        res.status(500).json({ error: "Could not determine user role." });
    }
});

// POST / - Пригласить пользователя
router.post(
    "/",
    hasRole(["owner"]),
    // --- ПРАВИЛА ВАЛИДАЦИИ ---
    body("email").isEmail().withMessage("Please provide a valid email address"),
    body("role").isIn(["editor", "viewer"]).withMessage("Role must be either 'editor' or 'viewer'"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const newPermission = await permissionService.inviteUser(req.params.projectId, req.user.id, req.body);
            res.status(201).json(newPermission);
        } catch (error) {
            res.status(error.statusCode || 500).json({ error: error.message });
        }
    }
);

// DELETE /:userId - Удалить участника
router.delete("/:userId", hasRole(["owner"]), async (req, res) => {
    try {
        await permissionService.removeUser(req.params.projectId, req.params.userId);
        res.status(200).json({ message: "User removed from project successfully" });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

module.exports = router;
