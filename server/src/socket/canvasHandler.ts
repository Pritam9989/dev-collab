import { Server, Socket } from 'socket.io';
import { rooms } from './roomHandler.js';
import { CanvasUpdateEvent } from '../types/index.js';

export function registerCanvasHandlers(io: Server, socket: Socket) {
  // Relay drawing paths and shape data across clients
  const handleDrawingData = ({ roomId, data }: CanvasUpdateEvent) => {
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    // Cache latest whiteboard serialized state
    room.whiteboardData = data;

    // Relay to other peers in the room
    const payload = { data, senderId: socket.id };
    socket.to(roomId).emit('drawing-data', payload);
    socket.to(roomId).emit('canvas:updated', payload);
  };

  // Support both 'drawing-data' and 'canvas:update'
  socket.on('drawing-data', handleDrawingData);
  socket.on('canvas:update', handleDrawingData);

  // Relay live path drawing step (sub-stroke streaming)
  socket.on('drawing-path-added', ({ roomId, pathData }: { roomId: string; pathData: any }) => {
    socket.to(roomId).emit('drawing-path-added', {
      pathData,
      senderId: socket.id,
    });
  });

  socket.on('canvas:draw-path', ({ roomId, pathData }: { roomId: string; pathData: any }) => {
    socket.to(roomId).emit('canvas:path-added', {
      pathData,
      senderId: socket.id,
    });
  });

  // Relay canvas clear across all room participants
  const handleClearCanvas = ({ roomId }: { roomId: string }) => {
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    room.whiteboardData = null;

    const payload = { senderId: socket.id };
    socket.to(roomId).emit('clear-canvas', payload);
    io.to(roomId).emit('canvas:cleared', payload);
  };

  socket.on('clear-canvas', handleClearCanvas);
  socket.on('canvas:clear', handleClearCanvas);
}
