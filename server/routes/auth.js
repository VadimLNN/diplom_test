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

module.exports = router;
