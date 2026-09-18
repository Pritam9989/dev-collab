import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket.js';
import { useWebRTC } from '../hooks/useWebRTC.js';
import { Navbar } from '../components/workspace/Navbar.js';
import { SplitPane } from '../components/workspace/SplitPane.js';
import { CodeEditor, CodeEditorHandle } from '../components/workspace/CodeEditor.js';
import { Whiteboard, WhiteboardHandle } from '../components/workspace/Whiteboard.js';
import { FloatingAvatars } from '../components/workspace/FloatingAvatars.js';
import { CommandPalette } from '../components/workspace/CommandPalette.js';
import { SideDrawer } from '../components/workspace/SideDrawer.js';
import { User, RoomState, ChatMessage } from '../types/index.js';

export const WorkspacePage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const { socket, isConnected } = useSocket();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState<string>('typescript');
  const [whiteboardData, setWhiteboardData] = useState<string | null>(null);
  const [isRoomReady, setIsRoomReady] = useState<boolean>(false);

  // ── Editor / UI State ──────────────────────────────────────────────────────
  const [editorTheme, setEditorTheme] = useState<string>('vs-dark');
  const [currentLanguage, setCurrentLanguage] = useState<string>('typescript');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [splitKey, setSplitKey] = useState<number>(0);

  // ── Chat & Side Drawer State ───────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [drawerTab, setDrawerTab] = useState<'chat' | 'participants'>('chat');
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // ── Refs to imperative handles ─────────────────────────────────────────────
  const codeEditorRef = useRef<CodeEditorHandle>(null);
  const whiteboardRef = useRef<WhiteboardHandle>(null);

  // Initialize WebRTC
  const {
    localStream,
    remoteStreams,
    isAudioMuted,
    isVideoMuted,
    isScreenSharing,
    isSpeaking,
    mediaError,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
  } = useWebRTC({
    socket,
    roomId: roomId || '',
    currentUser,
    peers: users,
  });

  // Join Room via Socket.io
  useEffect(() => {
    if (!socket || !roomId) return;

    const storedName = localStorage.getItem('devcollab_username') || `Dev_${Math.random().toString(36).slice(2, 6)}`;

    // Join room when connected
    if (isConnected) {
      socket.emit('join-room', {
        roomId,
        userName: storedName,
      });
      socket.emit('room:join', {
        roomId,
        userName: storedName,
      });
    }

    // Receive initial room state
    const handleRoomState = (data: RoomState) => {
      console.log('[Room] Received room state:', data);
      setCode(data.code);
      setLanguage(data.language);
      setWhiteboardData(data.whiteboardData);
      if (data.messages) {
        setMessages(data.messages);
      }
      setUsers(data.users || []);
      setCurrentUser(data.self);
      setIsRoomReady(true);
    };

    // A new peer joined
    const handleUserJoined = (newUser: User) => {
      console.log('[Room] User joined:', newUser);
      setUsers((prev) => {
        if (prev.some((u) => u.id === newUser.id)) return prev;
        return [...prev, newUser];
      });
    };

    // A peer left
    const handleUserLeft = ({ userId }: { userId: string }) => {
      console.log('[Room] User left:', userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    };

    // Media status updated for a user
    const handleMediaUpdated = (payload: { userId: string; isMuted?: boolean; isVideoOff?: boolean; isScreenSharing?: boolean }) => {
      setUsers((prev) =>
        prev.map((u) => (u.id === payload.userId ? { ...u, ...payload } : u))
      );
    };

    // New chat message received in room
    const handleChatMessage = (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });

      // Update unread count if drawer is closed or active tab is not chat
      setIsDrawerOpen((open) => {
        if (!open) {
          setUnreadCount((prevCount) => prevCount + 1);
        } else {
          setDrawerTab((tab) => {
            if (tab !== 'chat') {
              setUnreadCount((prevCount) => prevCount + 1);
            }
            return tab;
          });
        }
        return open;
      });
    };

    socket.on('room-state', handleRoomState);
    socket.on('room:state', handleRoomState);
    socket.on('user-joined', handleUserJoined);
    socket.on('user:joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('user:left', handleUserLeft);
    socket.on('media-state-changed', handleMediaUpdated);
    socket.on('user:media-updated', handleMediaUpdated);
    socket.on('chat:message', handleChatMessage);
    socket.on('chat-message', handleChatMessage);

    return () => {
      socket.off('room-state', handleRoomState);
      socket.off('room:state', handleRoomState);
      socket.off('user-joined', handleUserJoined);
      socket.off('user:joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('user:left', handleUserLeft);
      socket.off('media-state-changed', handleMediaUpdated);
      socket.off('user:media-updated', handleMediaUpdated);
      socket.off('chat:message', handleChatMessage);
      socket.off('chat-message', handleChatMessage);
      socket.emit('leave-room', { roomId });
      socket.emit('room:leave', { roomId });
    };
  }, [socket, isConnected, roomId]);

  // ── Cmd+K / Ctrl+K global shortcut ────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Command Palette callbacks ──────────────────────────────────────────────
  const handleToggleTheme = useCallback(() => {
    setEditorTheme((t) => (t === 'vs-dark' ? 'obsidian-dark' : 'vs-dark'));
  }, []);

  const handleFormatCode = useCallback(() => {
    codeEditorRef.current?.formatDocument();
  }, []);

  const handleClearCanvas = useCallback(() => {
    whiteboardRef.current?.clearCanvas();
  }, []);

  const handleResetSplit = useCallback(() => {
    setSplitKey((k) => k + 1);
  }, []);

  const handleSelectLanguage = useCallback((lang: string) => {
    setCurrentLanguage(lang);
    codeEditorRef.current?.setLanguage(lang);
  }, []);

  const handleLeaveRoom = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // ── Chat and Side Drawer Callbacks ─────────────────────────────────────────
  const handleSendMessage = useCallback((text: string) => {
    if (!socket || !roomId) return;
    socket.emit('chat:message', { roomId, text });
    socket.emit('chat-message', { roomId, text });
  }, [socket, roomId]);

  const handleToggleChat = useCallback(() => {
    setIsDrawerOpen((prev) => {
      if (!prev) {
        setDrawerTab('chat');
        setUnreadCount(0);
        return true;
      }
      if (drawerTab === 'chat') {
        return false;
      }
      setDrawerTab('chat');
      setUnreadCount(0);
      return true;
    });
  }, [drawerTab]);

  const handleToggleParticipants = useCallback(() => {
    setIsDrawerOpen((prev) => {
      if (!prev) {
        setDrawerTab('participants');
        return true;
      }
      if (drawerTab === 'participants') {
        return false;
      }
      setDrawerTab('participants');
      return true;
    });
  }, [drawerTab]);

  const handleTabChange = useCallback((tab: 'chat' | 'participants') => {
    setDrawerTab(tab);
    if (tab === 'chat') {
      setUnreadCount(0);
    }
  }, []);

  if (!roomId) {
    return (
      <div className="h-screen flex items-center justify-center bg-obsidian text-zinc-400">
        Invalid Room ID
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-obsidian text-zinc-100 overflow-hidden select-none">
      {/* Global Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        currentTheme={editorTheme}
        onToggleTheme={handleToggleTheme}
        isAudioMuted={isAudioMuted}
        onToggleAudio={toggleAudio}
        isVideoMuted={isVideoMuted}
        onToggleVideo={toggleVideo}
        isScreenSharing={isScreenSharing}
        onToggleScreenShare={toggleScreenShare}
        onLeaveRoom={handleLeaveRoom}
        onClearCanvas={handleClearCanvas}
        onFormatCode={handleFormatCode}
        onResetSplit={handleResetSplit}
        currentLanguage={currentLanguage}
        onSelectLanguage={handleSelectLanguage}
        onToggleChat={handleToggleChat}
        onToggleParticipants={handleToggleParticipants}
      />

      {/* Top Navbar with Chat and Participants Badges */}
      <Navbar
        roomId={roomId}
        users={users}
        currentUser={currentUser}
        isConnected={isConnected}
        onToggleChat={handleToggleChat}
        onToggleParticipants={handleToggleParticipants}
        unreadCount={unreadCount}
        isDrawerOpen={isDrawerOpen}
        activeTab={drawerTab}
      />

      {/* Main Workspace Resizable Split-Pane */}
      <main className="flex-1 w-full h-[calc(100vh-3.5rem)] relative overflow-hidden">
        {!isRoomReady && (
          <div className="absolute inset-0 z-30 bg-obsidian/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
            <span className="text-xs font-mono text-zinc-400">Syncing workspace state...</span>
          </div>
        )}
        <SplitPane
          key={splitKey}
          initialSplit={50}
          left={
            <CodeEditor
              ref={codeEditorRef}
              roomId={roomId}
              socket={socket}
              initialCode={code}
              initialLanguage={language}
              theme={editorTheme}
              onLanguageChange={setCurrentLanguage}
            />
          }
          right={
            <Whiteboard
              ref={whiteboardRef}
              roomId={roomId}
              socket={socket}
              initialCanvasData={whiteboardData}
            />
          }
        />

        {/* WebRTC Floating Avatars & Controls Dock */}
        <FloatingAvatars
          currentUser={currentUser}
          peers={users}
          localStream={localStream}
          remoteStreams={remoteStreams}
          isAudioMuted={isAudioMuted}
          isVideoMuted={isVideoMuted}
          isScreenSharing={isScreenSharing}
          isSpeaking={isSpeaking}
          mediaError={mediaError}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onToggleScreenShare={toggleScreenShare}
          onLeaveRoom={handleLeaveRoom}
        />

        {/* Real-time Chat & Participants Side Drawer */}
        <SideDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          activeTab={drawerTab}
          onTabChange={handleTabChange}
          unreadCount={unreadCount}
          messages={messages}
          onSendMessage={handleSendMessage}
          currentUser={currentUser}
          users={users}
          roomId={roomId}
        />
      </main>
    </div>
  );
};
