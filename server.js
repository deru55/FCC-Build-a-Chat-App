import http from 'http';
import fs from 'fs';
import { WebSocketServer } from 'ws';

const PORT = 3001;

const server = http.createServer(async (req, res) => {
    if (req.url === "/") {
        try {
            const html = await fs.promises.readFile("./public/index.html", "utf8");

            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(html);
        } catch (err) {
            res.writeHead(500);
            res.end("Error en el servidor");
        }
    }  else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
    }
})

const wss = new WebSocketServer({ server });

wss.on("connection", (socket, req) => {
    const username = new URL(req.url, "http://localhost").searchParams.get("username");

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ "type": "system", "text": `${username} joined` }));
        }
    });

    socket.on("message", (message) => {
        const messageObj = JSON.parse(message.toString());
        const text = messageObj.text;

        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'chat', username, text }));
            }
        });
    })

    socket.on("close", () => {
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'system', text: `${username} left` }));
            }
        });
    })
})


server.listen(PORT, () => {
    console.log(`Chat server running at http://localhost:${PORT}`);
});