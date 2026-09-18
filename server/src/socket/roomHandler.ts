import { Server, Socket } from 'socket.io';
import { RoomState, User } from '../types/index.js';

// In-memory room store: roomId -> RoomState
export const rooms: Map<string, RoomState> = new Map();

// Random developer-friendly user colors (Linear/Vercel neon accents)
const USER_COLORS = [
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#10b981', // Emerald
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#ec4899', // Pink
];

const DEFAULT_CODE = `// Welcome to DevCollab Workspace
// Real-time collaborative code editor & interactive canvas

function calculateVelocity(distance: number, time: number): number {
  if (time <= 0) throw new Error("Time must be positive");
  return distance / time;
}

console.log("DevCollab initialized. Realtime sync active!");
`;

export function getOrCreateRoom(roomId: string): RoomState {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      code: DEFAULT_CODE,
      language: 'typescript',
      whiteboardData: null,
      users: {},
      messages: [],
    });
  }
  return rooms.get(roomId)!;
}

export function registerRoomHandlers(io: Server, socket: Socket) {
  // Join room helper handler
  const handleJoin = ({ roomId, userName }: { roomId: string; userName?: string }) => {
    if (!roomId) return;

    socket.join(roomId);
    const room = getOrCreateRoom(roomId);

    const assignedColor = USER_COLORS[Object.keys(room.users).length % USER_COLORS.length];
    const user: User = {
      id: socket.id,
      name: userName?.trim() || `Dev_${socket.id.slice(0, 4)}`,
      color: assignedColor,
      isMuted: true,
      isVideoOff: true,
      isScreenSharing: false,
      joinedAt: Date.now(),
    };

    room.users[socket.id] = user;

    // Send complete current room state back to the joining socket
    const roomStatePayload = {
      roomId,
      code: room.code,
      language: room.language,
      whiteboardData: room.whiteboardData,
      users: Object.values(room.users),
      self: user,
      messages: room.messages || [],
    };

    socket.emit('room-state', roomStatePayload);
    socket.emit('room:state', roomStatePayload);

    // Also emit active-participants list
    socket.emit('active-users', Object.values(room.users));

    // Broadcast user joined to other peers in the room
    socket.to(roomId).emit('user-joined', user);
    socket.to(roomId).emit('user:joined', user);

    console.log(`[Room Management] User '${user.name}' (${socket.id}) joined room: ${roomId} [Total: ${Object.keys(room.users).length}]`);
  };

  // Listen for both 'join-room' and 'room:join'
  socket.on('join-room', handleJoin);
  socket.on('room:join', handleJoin);

  // User media status change (mute/camera/screen-share)
  socket.on('media-state-change', ({ roomId, isMuted, isVideoOff, isScreenSharing }: {
    roomId: string;
    isMuted?: boolean;
    isVideoOff?: boolean;
    isScreenSharing?: boolean;
  }) => {
    const room = rooms.get(roomId);
    if (!room || !room.users[socket.id]) return;

    const user = room.users[socket.id];
    if (isMuted !== undefined) user.isMuted = isMuted;
    if (isVideoOff !== undefined) user.isVideoOff = isVideoOff;
    if (isScreenSharing !== undefined) user.isScreenSharing = isScreenSharing;

    const updatePayload = {
      userId: socket.id,
      isMuted: user.isMuted,
      isVideoOff: user.isVideoOff,
      isScreenSharing: user.isScreenSharing,
    };

    io.to(roomId).emit('media-state-changed', updatePayload);
    io.to(roomId).emit('user:media-updated', updatePayload);
  });

  socket.on('user:media-state', ({ roomId, isMuted, isVideoOff, isScreenSharing }: {
    roomId: string;
    isMuted?: boolean;
    isVideoOff?: boolean;
    isScreenSharing?: boolean;
  }) => {
    const room = rooms.get(roomId);
    if (!room || !room.users[socket.id]) return;

    const user = room.users[socket.id];
    if (isMuted !== undefined) user.isMuted = isMuted;
    if (isVideoOff !== undefined) user.isVideoOff = isVideoOff;
    if (isScreenSharing !== undefined) user.isScreenSharing = isScreenSharing;

    const updatePayload = {
      userId: socket.id,
      isMuted: user.isMuted,
      isVideoOff: user.isVideoOff,
      isScreenSharing: user.isScreenSharing,
    };

    io.to(roomId).emit('media-state-changed', updatePayload);
    io.to(roomId).emit('user:media-updated', updatePayload);
  });

  // Explicit Leave Room
  const handleLeave = ({ roomId }: { roomId: string }) => {
    handleUserLeave(io, socket, roomId);
  };
  socket.on('leave-room', handleLeave);
  socket.on('room:leave', handleLeave);

  // Disconnection cleanup
  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (roomId !== socket.id) {
        handleUserLeave(io, socket, roomId);
      }
    }
  });
}

function handleUserLeave(io: Server, socket: Socket, roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  const user = room.users[socket.id];
  if (user) {
    delete room.users[socket.id];
    socket.leave(roomId);

    const leavePayload = { userId: socket.id, name: user.name };
    socket.to(roomId).emit('user-left', leavePayload);
    socket.to(roomId).emit('user:left', leavePayload);
    socket.to(roomId).emit('cursor-remove', { userId: socket.id });
    socket.to(roomId).emit('cursor:remove', { userId: socket.id });

    console.log(`[Room Management] User '${user.name}' (${socket.id}) left room: ${roomId} [Remaining: ${Object.keys(room.users).length}]`);

    if (Object.keys(room.users).length === 0) {
      console.log(`[Room Management] Room ${roomId} is now idle with 0 active users.`);
    }
  }
}
