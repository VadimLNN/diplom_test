const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const checkProjectAccess = require("../middleware/checkProjectAccess");
const { hasRole } = require("../middleware/checkRole");

// --- СЕРВИС
const projectService = require("../services/projectService");

router.use(authMiddleware);

// CREATE
router.post(
    "/",
    // 2a. Добавляем middleware для валидации
    body("name")
        .trim() // Убираем пробелы по краям
        .notEmpty()
        .withMessage("Project name cannot be empty.")
        .isLength({ max: 100 })
        .withMessage("Project name cannot be more than 100 characters."),
    body("description")
        .optional() // Делаем поле необязательным
        .trim()
        .isLength({ max: 500 })
        .withMessage("Description cannot be more than 500 characters."),

    // 2b. Основной обработчик роута
    async (req, res) => {
        // 2c. Проверяем результат валидации
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const userId = req.user.id;
            const projectData = req.body;
            const newProject = await projectService.createProject(userId, projectData);
            res.status(201).json(newProject);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
);

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
router.put(
    "/:id",
    // 3a. Middleware прав доступа остаются на своих местах
    [checkProjectAccess, hasRole(["owner"])],

    // 3b. Добавляем те же правила валидации, что и для создания
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Project name cannot be empty.")
        .isLength({ max: 100 })
        .withMessage("Project name cannot be more than 100 characters."),
    body("description").optional().trim().isLength({ max: 500 }).withMessage("Description cannot be more than 500 characters."),

    // 3c. Основной обработчик роута
    async (req, res) => {
        // 3d. Проверяем результат валидации
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const updatedProject = await projectService.updateProject(req.params.id, req.body);
            res.json(updatedProject);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
);

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
