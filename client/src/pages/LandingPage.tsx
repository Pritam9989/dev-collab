import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Code2,
  Sparkles,
  ArrowRight,
  Plus,
  LogIn,
  Palette,
  Video,
  Terminal,
} from 'lucide-react';
import { Modal } from '../components/common/Modal.js';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [userName, setUserName] = useState('');
  const [roomIdToJoin, setRoomIdToJoin] = useState('');

  // Generate unique readable room ID
  const generateRoomId = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 3; i++) {
      let segment = '';
      for (let j = 0; j < 3; j++) {
        segment += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      id += (i > 0 ? '-' : '') + segment;
    }
    return id;
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const roomId = generateRoomId();
    const name = userName.trim() || 'Anonymous Dev';
    localStorage.setItem('devcollab_username', name);
    navigate(`/room/${roomId}`);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomIdToJoin.trim()) return;
    const name = userName.trim() || 'Anonymous Dev';
    localStorage.setItem('devcollab_username', name);
    navigate(`/room/${roomIdToJoin.trim().toLowerCase()}`);
  };

  return (
    <div className="relative min-h-screen bg-obsidian text-zinc-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200 overflow-hidden">
      {/* Background ambient lighting glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-cyan-500/10 via-violet-500/5 to-transparent blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-cyan-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-violet-500/5 blur-[130px] pointer-events-none" />

      {/* Subtle Grid Background Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 flex items-center justify-center shadow-glow-cyan">
            <Code2 className="w-5 h-5 text-cyan-400" />
          </div>
          <span className="font-semibold text-lg tracking-tight">
            Dev<span className="text-cyan-400 font-bold">Collab</span>
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsJoinModalOpen(true)}
            className="text-xs text-zinc-400 hover:text-white px-3 py-2 rounded-lg transition-colors"
          >
            Enter Code
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-2 text-xs font-medium px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white shadow-glow-cyan transition-all"
          >
            <span>Launch Room</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 max-w-5xl mx-auto px-6 flex flex-col items-center justify-center text-center py-12">
        {/* Modern Pill Tag */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full glass-panel border border-cyan-500/30 mb-8 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-xs font-medium text-zinc-300">
            DevCollab Engine <span className="text-zinc-600">|</span> Real-Time Developer Workspace
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl leading-[1.1]">
          Real-time collaborative code & canvas{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400">
            built for high-velocity teams.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl font-normal leading-relaxed">
          Obsidian-dark workspace pairing the power of Monaco code editor with Fabric.js interactive whiteboard and WebRTC peer-to-peer audio/video streaming.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center space-x-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-medium text-sm shadow-glow-cyan transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Room</span>
          </button>

          <button
            onClick={() => setIsJoinModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center space-x-2.5 px-6 py-3.5 rounded-xl glass-panel-elevated hover:border-cyan-500/40 text-zinc-200 hover:text-white font-medium text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <LogIn className="w-4 h-4 text-cyan-400" />
            <span>Join Existing Room</span>
          </button>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-5 w-full text-left">
          {/* Card 1: Monaco Code */}
          <div className="group rounded-2xl glass-panel p-6 border border-white/5 hover:border-cyan-500/30 transition-all duration-300 hover:shadow-glow-cyan">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Terminal className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="font-semibold text-base text-zinc-100">Monaco Code Editor</h3>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
              Full VS Code editing engine with syntax highlighting for 10+ languages, smart formatting, and instantaneous sub-millisecond sync.
            </p>
          </div>

          {/* Card 2: Fabric Whiteboard */}
          <div className="group rounded-2xl glass-panel p-6 border border-white/5 hover:border-violet-500/30 transition-all duration-300 hover:shadow-glow-violet">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Palette className="w-5 h-5 text-violet-400" />
            </div>
            <h3 className="font-semibold text-base text-zinc-100">Fabric.js Whiteboard</h3>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
              Interactive vector whiteboard with geometric shapes, pencil brushes, color swatches, and real-time state sharing over WebSockets.
            </p>
          </div>

          {/* Card 3: WebRTC P2P */}
          <div className="group rounded-2xl glass-panel p-6 border border-white/5 hover:border-emerald-500/30 transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Video className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-base text-zinc-100">WebRTC Peer Streaming</h3>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
              Decentralized peer-to-peer audio and video streaming with sleek floating avatar pills, screen sharing, and mute toggles.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-obsidian-border/50 py-6 text-center text-xs text-zinc-600">
        <p>© 2026 DevCollab. Realtime Workspace for modern engineering teams.</p>
      </footer>

      {/* Create Room Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Workspace Room"
        description="Launch an instant real-time collaborative coding and whiteboarding session."
      >
        <form onSubmit={handleCreateRoom} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Your Developer Handle / Name
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. Alex, Maya, or Neo"
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm text-zinc-100 placeholder-zinc-500"
              autoFocus
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-medium text-xs shadow-glow-cyan transition-all"
            >
              <span>Launch Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </Modal>

      {/* Join Room Modal */}
      <Modal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        title="Join Workspace Room"
        description="Enter the Room ID or paste the invitation code provided by your teammate."
      >
        <form onSubmit={handleJoinRoom} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Room ID or Code
            </label>
            <input
              type="text"
              value={roomIdToJoin}
              onChange={(e) => setRoomIdToJoin(e.target.value)}
              placeholder="e.g. abc-def-ghi"
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm text-zinc-100 placeholder-zinc-500 font-mono"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Your Developer Handle / Name
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. Alex, Maya, or Neo"
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm text-zinc-100 placeholder-zinc-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsJoinModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-medium text-xs shadow-glow-cyan transition-all"
            >
              <span>Join Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
