const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const checkProjectAccess = require("../middleware/checkProjectAccess");
const { hasRole, getUserRoleInProject } = require("../middleware/checkRole");

// Сервис
const documentService = require("../services/documentService");

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: Управление документами внутри проектов
 */

/**
 * @swagger
 * /api/documents/project/{projectId}:
 *   get:
 *     summary: Получить все документы для конкретного проекта
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID проекта, документы которого нужно получить.
 *     responses:
 *       200:
 *         description: Список документов.
 *       403:
 *         description: Доступ к проекту запрещен.
 */
// GET /api/documents/project/:projectId
router.get("/project/:projectId", checkProjectAccess, async (req, res) => {
    try {
        const documents = await documentService.getDocumentsForProject(req.params.projectId);
        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: "Server error fetching documents" });
    }
});

/**
 * @swagger
 * /api/documents/{id}:
 *   get:
 *     summary: Получить один документ по его ID
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID документа.
 *     responses:
 *       200:
 *         description: Данные документа.
 *       403:
 *         description: Доступ к проекту, в котором находится документ, запрещен.
 *       404:
 *         description: Документ не найден.
 */
// GET /api/documents/:id
router.get("/:id", async (req, res) => {
    try {
        // 1. Получаем документ
        const document = await documentService.getDocumentById(req.params.id);
        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        // 2. Явно вызываем логику проверки доступа для проекта этого документа
        // Мы передаем `req`, чтобы `checkProjectAccess` мог взять `req.user`
        // Но мы подменяем `req.params`, чтобы он взял правильный `projectId`
        const fakeReq = { user: req.user, params: { projectId: document.project_id } };

        await checkProjectAccess(fakeReq, res, () => {
            // 3. Если `checkProjectAccess` вызвал `next()`, значит, доступ есть
            res.json(document);
        });
    } catch (error) {
        console.error("Error in GET /documents/:id :", error);
        res.status(500).json({ error: "Server error" });
    }
});

/**
 * @swagger
 * /api/documents/project/{projectId}:
 *   post:
 *     summary: Создать новый документ в проекте (для владельцев и редакторов)
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID проекта, в котором создается документ.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Meeting Notes"
 *               content:
 *                 type: string
 *                 example: "Initial content..."
 *     responses:
 *       201:
 *         description: Документ успешно создан.
 *       403:
 *         description: Недостаточно прав для создания (не владелец/редактор).
 */
// POST /api/documents/project/:projectId
router.post(
    "/project/:projectId",
    [checkProjectAccess, hasRole(["owner", "editor"])],
    // --- ПРАВИЛА ВАЛИДАЦИИ ---
    body("title")
        .trim()
        .notEmpty()
        .withMessage("Title cannot be empty")
        .isLength({ max: 150 })
        .withMessage("Title cannot be more than 150 characters"),
    body("content").optional().isString().withMessage("Content must be a string"), // Базовая проверка типа

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const newDocument = await documentService.createDocument(req.user.id, req.params.projectId, req.body);
            res.status(201).json(newDocument);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
);

/**
 * @swagger
 * /api/documents/{id}:
 *   put:
 *     summary: Обновить документ (для владельцев и редакторов)
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID документа.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Документ успешно обновлен.
 *       403:
 *         description: Недостаточно прав для редактирования.
 */
// PUT /api/documents/:id
router.put(
    "/:id",
    // --- ПРАВИЛА ВАЛИДАЦИИ ---
    // Здесь мы делаем поля опциональными, так как можно обновлять что-то одно
    body("title")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Title cannot be empty")
        .isLength({ max: 150 })
        .withMessage("Title cannot be more than 150 characters"),
    body("content").optional().isString().withMessage("Content must be a string"),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const updatedDocument = await documentService.updateDocument(req.user.id, req.params.id, req.body);
            res.json(updatedDocument);
        } catch (error) {
            res.status(error.statusCode || 400).json({ error: error.message });
        }
    }
);

/**
 * @swagger
 * /api/documents/{id}:
 *   delete:
 *     summary: Удалить документ (для владельцев и редакторов)
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID документа.
 *     responses:
 *       204:
 *         description: Документ успешно удален (нет тела ответа).
 *       403:
 *         description: Недостаточно прав для удаления.
 */
// DELETE /api/documents/:id
router.delete("/:id", async (req, res) => {
    try {
        await documentService.deleteDocument(req.user.id, req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(error.statusCode || 400).json({ error: error.message });
    }
});

module.exports = router;
