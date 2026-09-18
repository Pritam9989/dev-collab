import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { registerRoomHandlers, rooms } from './socket/roomHandler.js';
import { registerCodeHandlers } from './socket/codeHandler.js';
import { registerCanvasHandlers } from './socket/canvasHandler.js';
import { registerWebRTCHandlers } from './socket/webrtcHandler.js';
import { registerChatHandlers } from './socket/chatHandler.js';
import { executeHandler } from './routes/executeHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json());

// HTTP Server & Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

// REST Endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    activeRooms: rooms.size,
  });
});

app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json({
    id: room.id,
    language: room.language,
    participantCount: Object.keys(room.users).length,
  });
});

app.post('/api/execute', executeHandler);

// Socket connection
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  registerRoomHandlers(io, socket);
  registerCodeHandlers(io, socket);
  registerCanvasHandlers(io, socket);
  registerWebRTCHandlers(io, socket);
  registerChatHandlers(io, socket);

  socket.on('disconnect', (reason) => {
    console.log(`[Socket] Disconnected: ${socket.id} (${reason})`);
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`
  🚀 DevCollab Server Running!
  ------------------------------------
  📡 Port: http://localhost:${PORT}
  🔌 Socket.io: enabled
  🌐 Allowed Origin: ${CLIENT_URL}
  ------------------------------------
  `);
});
