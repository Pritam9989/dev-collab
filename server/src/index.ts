import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { registerRoomHandlers, rooms } from './socket/roomHandler.js';
import { registerCodeHandlers } from './socket/codeHandler.js';
import { registerCanvasHandlers } from './socket/canvasHandler.js';
import { registerWebRTCHandlers } from './socket/webrtcHandler.js';
import { registerChatHandlers } from './socket/chatHandler.js';
import { executeHandler } from './routes/executeHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL;

// Flexible CORS setup that supports localhost and any production domain
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or same-origin static files)
    if (!origin) return callback(null, true);
    if (
      !CLIENT_URL ||
      origin === CLIENT_URL ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.onrender.com') ||
      origin.endsWith('.github.io')
    ) {
      return callback(null, true);
    }
    // Fallback: allow origin in production
    return callback(null, true);
  },
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// HTTP Server & Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
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

// Serve built frontend if available (Full-stack production mode)
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  console.log(`[Static] Serving frontend from ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

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
