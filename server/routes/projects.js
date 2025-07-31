const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const checkProjectAccess = require("../middleware/checkProjectAccess");
const { hasRole } = require("../middleware/checkRole");

// --- СЕРВИС
const projectService = require("../services/projectService");

router.use(authMiddleware);

// CREATE
router.post("/", async (req, res) => {
    try {
        // 1. Извлекаем данные из запроса.
        const userId = req.user.id;
        const projectData = req.body;

        // 2. Делегируем создание сервису.
        const newProject = await projectService.createProject(userId, projectData);

        // 3. Отправляем успешный ответ.
        res.status(201).json(newProject);
    } catch (error) {
        // 4. Если сервис выбросил ошибку (например, валидации), ловим её.
        res.status(400).json({ error: error.message });
    }
});

// READ (ALL)
router.get("/", async (req, res) => {
    try {
        const projects = await projectService.getAllProjectsForUser(req.user.id);
        res.json(projects);
    } catch (error) {
        console.error(error); // Ошибки на GET запросах лучше логировать на сервере
        res.status(500).json({ error: "Failed to fetch projects" });
    }
});

// READ (ONE)
router.get("/:id", checkProjectAccess, async (req, res) => {
    try {
        const project = await projectService.getProjectById(req.params.id);
        if (!project) {
            // Эта проверка нужна, если проект был удален после проверки доступа
            return res.status(404).json({ error: "Project not found." });
        }
        res.json(project);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch project" });
    }
});

// UPDATE
router.put("/:id", [checkProjectAccess, hasRole(["owner"])], async (req, res) => {
    try {
        const updatedProject = await projectService.updateProject(req.params.id, req.body);
        res.json(updatedProject);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE - Удаление проекта
router.delete("/:id", [checkProjectAccess, hasRole(["owner"])], async (req, res) => {
    try {
        await projectService.deleteProject(req.params.id);
        res.status(200).json({ message: "Project deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete project" });
    }
});

module.exports = router;
