const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware"); // <-- Импортируем middleware

const authService = require("../services/authService");

router.post("/register", async (req, res) => {
    try {
        const newUser = await authService.register(req.body);
        res.status(201).json(newUser);
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

router.post("/login", async (req, res) => {
    try {
        const result = await authService.login(req.body);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

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
