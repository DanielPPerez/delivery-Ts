"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const ws_1 = require("ws");
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const polling_controller_1 = require("./controllers/polling.controller");

const app = (0, express_1.default)();
exports.app = app;
const server = http_1.default.createServer(app);
exports.server = server;

const wss = new ws_1.Server({ server, path: '/ws' });

app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)());
app.use("/user", auth_routes_1.default);
app.use('/shortPolling', polling_controller_1.shortPollingRouter);
app.use('/longPolling', polling_controller_1.longPollingRouter);

let connectedUsers = 0;
let activeSockets = [];

wss.on('connection', (socket) => {
    console.log('A client has connected');
    connectedUsers++;
    activeSockets.push(socket);
    socket.send(JSON.stringify({ type: 'connected_users', count: connectedUsers }));

    socket.on('message', (message) => {
        const data = JSON.parse(message);
        switch (data.type) {
            case 'chat_message':
                // Broadcast the message to all connected sockets except the sender
                activeSockets.forEach((client) => {
                    if (client !== socket && client.readyState === ws_1.OPEN) {
                        client.send(JSON.stringify({ type: 'chat_message', message: data.message }));
                    }
                });
                break;
            case 'get_connected_users':
                socket.send(JSON.stringify({ type: 'connected_users', count: connectedUsers }));
                break;
            case 'private_message':
                const { recipientSocketId, message } = data;
                const recipientSocket = activeSockets.find((client) => client._socket.remoteAddress === recipientSocketId);
                if (recipientSocket) {
                    recipientSocket.send(JSON.stringify({ type: 'private_message', senderSocketId: socket._socket.remoteAddress, message }));
                }
                break;
        }
    });

    socket.on('close', () => {
        connectedUsers--;
        activeSockets = activeSockets.filter((activeSocket) => activeSocket !== socket);
    });
});

const pollConnectedUsers = () => {
    const data = JSON.stringify({ type: 'connected_users', count: connectedUsers });
    activeSockets.forEach((socket) => {
        if (socket.readyState === ws_1.OPEN) {
            socket.send(data);
        }
    });
    setTimeout(pollConnectedUsers, 5000);
};

pollConnectedUsers();
