const { app, server } = require("./app");
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`🚀 Server: http://localhost:${PORT}`);
    console.log(`📚 Swagger: http://localhost:${PORT}/api-docs`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}/api/collab`);
});
