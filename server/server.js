const { app, server } = require("./app");
const PORT = process.env.PORT || 5000;
const HOCO_PORT = process.env.HOCO_PORT;
const hocuspocusServer = require("./realtime/hocuspocus_server");

server.listen(PORT, () => {
    console.log(`🚀 Server: http://...:${PORT}`);
    console.log(`📚 Swagger: http://...:${PORT}/api-docs`);
});

hocuspocusServer.listen(HOCO_PORT, () => {
    console.log("🔌 Hocuspocus WS: ws:/.../api/collab");
});
