const { app, server } = require("./app");
const PORT = process.env.PORT || 5000;
const hocuspocusServer = require("./realtime/hocuspocus_server");

server.listen(PORT, () => {
    console.log(`🚀 Server: http://localhost:${PORT}`);
    console.log(`📚 Swagger: http://localhost:${PORT}/api-docs`);
});

hocuspocusServer.listen(1234, () => {
    console.log("🔌 Hocuspocus WS: ws://localhost:1234/api/collab");
});
