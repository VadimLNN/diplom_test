// Импортируем 'server' из нашего конфигурационного файла app.js
const { server } = require("./app");

// Получаем порт из переменных окружения, которые уже были загружены в app.js
const PORT = process.env.PORT || 5000;

// Запускаем сервер
server.listen(PORT, () => {
    console.log(`🚀 Server with WebSocket support running on port ${PORT}`);
});
