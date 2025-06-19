// routes/invitations.js
const express = require("express");
const router = express.Router({ mergeParams: true }); // mergeParams нужен, чтобы получить :projectId из родительского роута
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

// Middleware для проверки, что текущий пользователь - владелец проекта
const isOwner = async (req, res, next) => {
    const { projectId } = req.params;
    const ownerId = req.user.id;
    try {
        const project = await pool.query("SELECT owner_id FROM projects WHERE id = $1", [projectId]);
        if (project.rows.length === 0 || project.rows[0].owner_id !== ownerId) {
            return res.status(403).json({ error: "Forbidden: You are not the owner of this project." });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: "Server error checking ownership" });
    }
};

// POST /api/projects/:projectId/invitations - Пригласить пользователя
router.post("/", isOwner, async (req, res) => {
    const { projectId } = req.params;
    const { email, role } = req.body; // Приглашаем по email, роль - 'editor' или 'viewer'

    if (!email || !role) {
        return res.status(400).json({ error: "User email and role are required" });
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

// GET /api/projects/:projectId/members - Получить список участников
router.get("/", async (req, res) => {
    // Этот роут должен быть доступен всем участникам проекта, не только владельцу
    // TODO: Добавить проверку checkProjectAccess
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
        console.error("Failed to fetch project members:", error);
        res.status(500).json({ error: "Failed to fetch project members" });
    }
});

// DELETE /api/projects/:projectId/members/:userId - Удалить участника
router.delete("/:userId", isOwner, async (req, res) => {
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
