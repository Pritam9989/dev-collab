export interface User {
  id: string; // Socket ID
  odUserId?: string; // Persistent client-generated user ID
  name: string;
  color: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  joinedAt: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  text: string;
  timestamp: number;
}

export interface RoomState {
  id: string;
  code: string;
  language: string;
  whiteboardData: string | null;
  users: Record<string, User>;
  messages: ChatMessage[];
}

export interface CodeChangeEvent {
  roomId: string;
  code: string;
}

export interface CodeLanguageEvent {
  roomId: string;
  language: string;
}

export interface CanvasUpdateEvent {
  roomId: string;
  data: string; // Serialized Fabric.js canvas JSON
}

export interface WebRTCSignalEvent {
  targetId: string;
  senderId: string;
  signal: any;
}
