import { Server, Socket } from 'socket.io';
import { rooms } from './roomHandler.js';
import { ChatMessage } from '../types/index.js';

export function registerChatHandlers(io: Server, socket: Socket) {
  // Handle new incoming chat message
  const handleChatMessage = ({
    roomId,
    text,
    message,
  }: {
    roomId: string;
    text?: string;
    message?: string;
  }) => {
    const rawText = text ?? message ?? '';
    const trimmed = rawText.trim();
    if (!roomId || !trimmed) return;

    const room = rooms.get(roomId);
    if (!room) return;

    const user = room.users[socket.id];
    const chatMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      roomId,
      senderId: socket.id,
      senderName: user ? user.name : `Dev_${socket.id.slice(0, 4)}`,
      senderColor: user ? user.color : '#06b6d4',
      text: trimmed,
      timestamp: Date.now(),
    };

    if (!room.messages) {
      room.messages = [];
    }
    room.messages.push(chatMsg);
    if (room.messages.length > 200) {
      room.messages.shift();
    }

    // Broadcast to everyone in the room (including sender)
    io.to(roomId).emit('chat:message', chatMsg);
    io.to(roomId).emit('chat-message', chatMsg);

    console.log(`[Chat] [Room ${roomId}] ${chatMsg.senderName}: ${trimmed.slice(0, 40)}`);
  };

  socket.on('chat:message', handleChatMessage);
  socket.on('chat-message', handleChatMessage);
  socket.on('chat:send', handleChatMessage);

  // Allow client to request message history
  const handleGetHistory = ({ roomId }: { roomId: string }) => {
    if (!roomId) return;
    const room = rooms.get(roomId);
    const history = room?.messages || [];
    socket.emit('chat:history', history);
  };

  socket.on('chat:history', handleGetHistory);
  socket.on('get-chat-history', handleGetHistory);
}
