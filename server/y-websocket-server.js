const { serve } = require("y-websocket");

serve({ port: 1234, endpoint: "ws" }, (wss) => {
    console.log("y-websocket server running on port 1234");
    wss.on("connection", (ws, req) => {
        console.log("WebSocket connection established:", req.url);
    });
});
