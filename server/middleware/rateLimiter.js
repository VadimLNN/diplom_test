const rateLimit = require("express-rate-limit");

// Настраиваем ограничение специально для эндпоинта логина
const loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 минут - временное окно
    max: 10, // Максимальное количество запросов с одного IP за это время
    standardHeaders: true, // Включаем стандартные заголовки 'RateLimit-*' в ответ
    legacyHeaders: false, // Отключаем старые заголовки 'X-RateLimit-*'

    // Сообщение, которое будет отправлено пользователю при превышении лимита
    message: {
        error: "Too many login attempts from this IP, please try again after 15 minutes",
    },

    // Функция, которая определяет, как отслеживать пользователя (по IP-адресу)
    keyGenerator: (req, res) => {
        return req.ip;
    },
});

module.exports = {
    loginLimiter,
    // Здесь в будущем можно будет добавить другие лимитеры,
    // например, для создания проектов или других "дорогих" операций
};
