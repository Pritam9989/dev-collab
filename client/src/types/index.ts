export interface User {
  id: string;
  name: string;
  color: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  joinedAt?: number;
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
  roomId: string;
  code: string;
  language: string;
  whiteboardData: string | null;
  users: User[];
  self: User;
  messages?: ChatMessage[];
}

export type DrawingTool = 'select' | 'pencil' | 'rect' | 'circle' | 'line' | 'text' | 'eraser';

export interface CodeLanguage {
  id: string;
  name: string;
  extension: string;
}

export const SUPPORTED_LANGUAGES: CodeLanguage[] = [
  { id: 'typescript', name: 'TypeScript', extension: 'ts' },
  { id: 'javascript', name: 'JavaScript', extension: 'js' },
  { id: 'python', name: 'Python', extension: 'py' },
  { id: 'cpp', name: 'C++', extension: 'cpp' },
  { id: 'c', name: 'C', extension: 'c' },
  { id: 'java', name: 'Java', extension: 'java' },
  { id: 'rust', name: 'Rust', extension: 'rs' },
  { id: 'go', name: 'Go', extension: 'go' },
  { id: 'html', name: 'HTML', extension: 'html' },
  { id: 'css', name: 'CSS', extension: 'css' },
  { id: 'json', name: 'JSON', extension: 'json' },
  { id: 'markdown', name: 'Markdown', extension: 'md' },
  { id: 'sql', name: 'SQL', extension: 'sql' },
];

export { LANGUAGE_BOILERPLATES } from './boilerplates.js';

export interface PeerMedia {
  userId: string;
  user: User;
  stream?: MediaStream;
}
