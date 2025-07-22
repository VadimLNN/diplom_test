const express = require("express");
const router = express.Router({ mergeParams: true }); // mergeParams нужен, чтобы получить :projectId из родительского роута
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const { hasRole, getUserRoleInProject } = require("../middleware/checkRole");

router.use(authMiddleware);

// GET / - Получить список участников (все участники проекта)
router.get("/", checkProjectAccess, async (req, res) => {
    const { projectId } = req.params;
    try {
        const result = await pool.query(
            `SELECT u.id, u.username, u.email, pp.role 
             FROM users u 
             JOIN project_permissions pp ON u.id = pp.user_id 
             WHERE pp.project_id = $1`,
            [projectId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch project members" });
    }
});

// GET /my-role - НОВЫЙ РОУТ для получения своей роли
router.get("/my-role", checkProjectAccess, async (req, res) => {
    const { projectId } = req.params;
    const userId = req.user.id;
    const role = await getUserRoleInProject(userId, projectId);
    res.json({ role });
});

// POST / - Пригласить пользователя (только владелец)
router.post("/", hasRole(["owner"]), async (req, res) => {
    const { projectId } = req.params;
    const { email, role } = req.body;
    if (!email || !role || !["editor", "viewer"].includes(role)) {
        return res.status(400).json({ error: "User email and a valid role ('editor' or 'viewer') are required" });
    }
    try {
        // Находим ID пользователя по email
        const userToInvite = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
        if (userToInvite.rows.length === 0) {
            return res.status(404).json({ error: "User with this email not found" });
        }
        const userIdToInvite = userToInvite.rows[0].id;

        // Добавляем запись в permissions
        const newPermission = await pool.query("INSERT INTO project_permissions (project_id, user_id, role) VALUES ($1, $2, $3) RETURNING *", [
            projectId,
            userIdToInvite,
            role,
        ]);

        res.status(201).json(newPermission.rows[0]);
    } catch (error) {
        if (error.code === "23505") {
            // unique_violation
            return res.status(409).json({ error: "This user already has access to the project." });
        }
        console.error(error);
        res.status(500).json({ error: "Failed to invite user" });
    }
});

// DELETE /api/projects/:projectId/members/:userId - Удалить участника
router.delete("/:userId", hasRole(["owner"]), async (req, res) => {
    const { projectId, userId } = req.params;
    try {
        await pool.query("DELETE FROM project_permissions WHERE project_id = $1 AND user_id = $2", [projectId, userId]);
        res.status(200).json({ message: "User removed from project" });
    } catch (error) {
        console.error("Failed to remove user:", error);
        res.status(500).json({ error: "Failed to remove user" });
    }
});

module.exports = router;
