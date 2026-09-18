import { Server, Socket } from 'socket.io';
import { rooms } from './roomHandler.js';
import { CodeChangeEvent, CodeLanguageEvent } from '../types/index.js';

export function registerCodeHandlers(io: Server, socket: Socket) {
  // Low latency code change relay handler
  const handleCodeChange = ({ roomId, code }: CodeChangeEvent) => {
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    // Update in-memory code state for persistent synchronization
    room.code = code;

    // Relay to other peers in the room with lowest latency (excluding sender)
    const payload = { code, senderId: socket.id };
    socket.to(roomId).emit('code-change', payload);
    socket.to(roomId).emit('code:updated', payload);
  };

  // Listen for both 'code-change' and 'code:change'
  socket.on('code-change', handleCodeChange);
  socket.on('code:change', handleCodeChange);

  // Programming language synchronization
  const handleLanguageChange = ({ roomId, language }: CodeLanguageEvent) => {
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    room.language = language;

    const payload = { language, senderId: socket.id };
    io.to(roomId).emit('code-language-change', payload);
    io.to(roomId).emit('code:language-updated', payload);
  };

  socket.on('code-language-change', handleLanguageChange);
  socket.on('code:language-change', handleLanguageChange);

  // Collaborative cursor & selection tracking
  const handleCursorMove = ({
    roomId,
    position,
    selection,
  }: {
    roomId: string;
    position: { lineNumber: number; column: number };
    selection?: {
      startLineNumber: number;
      startColumn: number;
      endLineNumber: number;
      endColumn: number;
    } | null;
  }) => {
    if (!roomId || !position) return;
    const room = rooms.get(roomId);
    const user = room?.users[socket.id];

    const cursorPayload = {
      userId: socket.id,
      user: {
        id: socket.id,
        name: user?.name || `Dev_${socket.id.slice(0, 4)}`,
        color: user?.color || '#06b6d4',
      },
      position,
      selection: selection || null,
    };

    socket.to(roomId).emit('cursor-update', cursorPayload);
    socket.to(roomId).emit('cursor:update', cursorPayload);
    socket.to(roomId).emit('cursor:updated', cursorPayload);
  };

  socket.on('cursor-move', handleCursorMove);
  socket.on('cursor:move', handleCursorMove);
  socket.on('cursor-change', handleCursorMove);
  socket.on('cursor:change', handleCursorMove);
}
