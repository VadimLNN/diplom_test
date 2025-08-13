const { body, validationResult } = require("express-validator");
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware"); // <-- Импортируем middleware
const authService = require("../services/authService");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Аутентификация и управление пользователями
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Уникальное имя пользователя.
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Уникальный email пользователя.
 *                 example: johndoe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Пароль (минимум 6 символов).
 *                 example: password123
 *     responses:
 *       201:
 *         description: Пользователь успешно создан. Возвращает данные пользователя (без пароля).
 *       400:
 *         description: Ошибка валидации (например, невалидный email или короткий пароль).
 *       409:
 *         description: Конфликт (пользователь с таким username или email уже существует).
 */
router.post(
    "/register",
    body("username").isLength({ min: 3 }).withMessage("Username must be at least 3 characters long"),
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Если есть ошибки, возвращаем 400 и список ошибок
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const newUser = await authService.register(req.body);
            res.status(201).json(newUser);
        } catch (error) {
            res.status(error.statusCode || 500).json({ error: error.message });
        }
    }
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход пользователя в систему
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: johndoe
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Успешный вход. Возвращает JWT токен.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Неверные учетные данные.
 */
router.post(
    "/login",
    body("username").isLength({ min: 3 }).withMessage("Username must be at least 3 characters long"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Если есть ошибки, возвращаем 400 и список ошибок
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const result = await authService.login(req.body);
            res.status(200).json(result);
        } catch (error) {
            res.status(error.statusCode || 500).json({ error: error.message });
        }
    }
);

/**
 * @swagger
 * /api/auth/user:
 *   get:
 *     summary: Получение информации о текущем пользователе
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные текущего пользователя.
 *       401:
 *         description: Неавторизован (токен отсутствует или невалиден).
 */
router.get("/user", authMiddleware, async (req, res) => {
    try {
        const user = await authService.getUserInfo(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch user data" });
    }
});

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Смена пароля для текущего пользователя
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: Текущий (старый) пароль пользователя.
 *                 example: password123
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: Новый пароль (минимум 6 символов).
 *                 example: newSecurePassword456
 *     responses:
 *       '200':
 *         description: Пароль успешно обновлен.
 *       '400':
 *         description: Ошибка валидации (например, новый пароль слишком короткий).
 *       '401':
 *         description: Неверный текущий пароль.
 */
router.put(
    "/change-password",
    authMiddleware, // Пользователь должен быть авторизован
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters long"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const userId = req.user.id;
            const { currentPassword, newPassword } = req.body;

            // Вызываем новый метод сервиса для смены пароля
            await authService.changePassword(userId, currentPassword, newPassword);

            res.status(200).json({ message: "Password updated successfully." });
        } catch (error) {
            res.status(error.statusCode || 500).json({ error: error.message });
        }
    }
);

/**
 * @swagger
 * /api/auth/delete-account:
 *   delete:
 *     summary: Удаление аккаунта текущего пользователя
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Текущий пароль для подтверждения удаления.
 *                 example: password123
 *     responses:
 *       '200':
 *         description: Аккаунт и все связанные с ним данные успешно удалены.
 *       '401':
 *         description: Неверный пароль для подтверждения.
 */
router.delete(
    "/delete-account",
    authMiddleware, // Пользователь должен быть авторизован
    body("password").notEmpty().withMessage("Password is required for confirmation"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const userId = req.user.id;
            const { password } = req.body;

            // Вызываем новый метод сервиса для удаления
            await authService.deleteAccount(userId, password);

            res.status(200).json({ message: "Account deleted successfully." });
        } catch (error) {
            res.status(error.statusCode || 500).json({ error: error.message });
        }
    }
);

module.exports = router;
