const { body, validationResult } = require("express-validator");
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware"); // <-- Импортируем middleware

const authService = require("../services/authService");

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
