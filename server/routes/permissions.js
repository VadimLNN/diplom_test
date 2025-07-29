const express = require("express");
const router = express.Router({ mergeParams: true });
const pool = require("../db");

const authMiddleware = require("../middleware/authMiddleware");
const checkProjectAccess = require("../middleware/checkProjectAccess");
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

        const ownerResult = await pool.query(
            `SELECT id, username, email, 'owner' as role 
             FROM users WHERE id = (SELECT owner_id FROM projects WHERE id = $1)`,
            [projectId]
        );

        // Объединяем списки и убираем дубликаты, если владелец сам себя пригласил
        const membersMap = new Map();
        [...ownerResult.rows, ...result.rows].forEach((member) => {
            membersMap.set(member.id, member);
        });

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch project members" });
    }
});

// GET /my-role - НОВЫЙ РОУТ для получения своей роли
router.get("/my-role", checkProjectAccess, async (req, res) => {
    const { projectId } = req.params;
    const userId = req.user.id;
    try {
        const role = await getUserRoleInProject(userId, projectId);
        res.json({ role });
    } catch (error) {
        // Ошибка уже будет обработана в getUserRoleInProject, но на всякий случай
        res.status(500).json({ error: "Could not determine user role." });
    }
});

// POST / - Пригласить пользователя (только владелец)
router.post("/", hasRole(["owner"]), async (req, res) => {
    const { projectId } = req.params;
    const { email, role } = req.body;

    // Валидация роли на сервере
    if (!email || !role || !["editor", "viewer"].includes(role)) {
        return res.status(400).json({ error: "User email and a valid role ('editor' or 'viewer') are required" });
    }

    try {
        const userToInvite = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
        if (userToInvite.rows.length === 0) {
            return res.status(404).json({ error: "User with this email not found" });
        }

        const userIdToInvite = userToInvite.rows[0].id;

        // Проверка, не пытается ли владелец пригласить самого себя
        const projectOwner = await pool.query("SELECT owner_id FROM projects WHERE id = $1", [projectId]);
        if (projectOwner.rows[0].owner_id === userIdToInvite) {
            return res.status(400).json({ error: "Cannot invite the project owner." });
        }

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
        console.error("Invite user error:", error);
        res.status(500).json({ error: "Failed to invite user" });
    }
});

// DELETE /api/projects/:projectId/members/:userId - Удалить участника
router.delete("/:userId", hasRole(["owner"]), async (req, res) => {
    const { projectId, userId } = req.params;

    const projectOwner = await pool.query("SELECT owner_id FROM projects WHERE id = $1", [projectId]);
    if (String(projectOwner.rows[0].owner_id) === String(userId)) {
        return res.status(400).json({ error: "Project owner cannot be removed." });
    }

    try {
        await pool.query("DELETE FROM project_permissions WHERE project_id = $1 AND user_id = $2", [projectId, userId]);
        res.status(200).json({ message: "User removed from project successfully" });
    } catch (error) {
        console.error("Failed to remove user:", error);
        res.status(500).json({ error: "Failed to remove user" });
    }
});

module.exports = router;
