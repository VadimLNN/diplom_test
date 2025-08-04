const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const checkProjectAccess = require("../middleware/checkProjectAccess");
const { hasRole } = require("../middleware/checkRole");

// --- СЕРВИС
const projectService = require("../services/projectService");

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Управление проектами
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - owner_id
 *       properties:
 *         id:
 *           type: integer
 *           description: Уникальный идентификатор проекта.
 *         name:
 *           type: string
 *           description: Название проекта.
 *         description:
 *           type: string
 *           description: Описание проекта.
 *         owner_id:
 *           type: integer
 *           description: ID пользователя-владельца.
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Дата создания проекта.
 *       example:
 *         id: 1
 *         name: "My First Project"
 *         description: "This is a sample project for the documentation."
 *         owner_id: 123
 *         created_at: "2024-01-01T12:00:00.000Z"
 */

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Создание нового проекта
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "New Marketing Campaign"
 *               description:
 *                 type: string
 *                 example: "Details about Q3 campaign"
 *     responses:
 *       201:
 *         description: Проект успешно создан.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400:
 *         description: Ошибка валидации.
 *       401:
 *         description: Неавторизован.
 */
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

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Получение списка всех доступных проектов (своих и расшаренных)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список проектов.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 *       401:
 *         description: Неавторизован.
 */
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

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Получение информации о конкретном проекте
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID проекта
 *     responses:
 *       200:
 *         description: Данные проекта.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       403:
 *         description: Доступ запрещен.
 *       404:
 *         description: Проект не найден.
 */
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

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Обновление проекта (доступно только владельцу)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Уникальный ID проекта для обновления
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Новое название проекта (макс. 100 символов).
 *                 example: "Updated Marketing Campaign"
 *               description:
 *                 type: string
 *                 description: Новое описание проекта (макс. 500 символов).
 *                 example: "Updated details about the Q3 campaign."
 *     responses:
 *       '200':
 *         description: Проект успешно обновлен. Возвращает обновленный объект проекта.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       '400':
 *         description: Ошибка валидации (например, пустое название или превышена длина).
 *       '403':
 *         description: Доступ запрещен (пользователь не является владельцем проекта).
 *       '404':
 *         description: Проект не найден.
 */
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

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Удаление проекта (доступно только владельцу)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID проекта
 *     responses:
 *       200:
 *         description: Проект успешно удален.
 *       403:
 *         description: Доступ запрещен (не владелец).
 */
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
