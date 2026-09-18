import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Users,
  Send,
  X,
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  Copy,
  Check,
  Radio,
} from 'lucide-react';
import { User, ChatMessage } from '../../types/index.js';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'chat' | 'participants';
  onTabChange: (tab: 'chat' | 'participants') => void;
  unreadCount: number;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  currentUser: User | null;
  users: User[];
  roomId: string;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  unreadCount,
  messages,
  onSendMessage,
  currentUser,
  users,
  roomId,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive or drawer opens to chat
  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, activeTab]);

  // Focus input when chat tab is selected
  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      inputRef.current?.focus();
    }
  }, [isOpen, activeTab]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <aside
      aria-label="Workspace Sidebar"
      className={`fixed top-14 right-0 bottom-0 z-30 w-80 sm:w-96 flex flex-col bg-obsidian-elevated/95 backdrop-blur-2xl border-l border-obsidian-border shadow-2xl transition-transform duration-300 ease-in-out select-none ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* ── Top Header with Tab Switcher ── */}
      <div className="h-12 px-3 border-b border-obsidian-border flex items-center justify-between bg-obsidian/80">
        <div className="flex items-center space-x-1">
          {/* Chat Tab Button */}
          <button
            onClick={() => onTabChange('chat')}
            className={`relative flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'chat'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
            {/* Unread badge if on another tab or has unread */}
            {unreadCount > 0 && activeTab !== 'chat' && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-cyan-500 text-black animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Participants Tab Button */}
          <button
            onClick={() => onTabChange('participants')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'participants'
                ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Peers</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-zinc-300">
              {users.length}
            </span>
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          title="Close Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Tab Body ── */}
      {activeTab === 'chat' ? (
        /* ══════════════════════════════════════════════════════════
           CHAT TAB CONTENT
           ══════════════════════════════════════════════════════════ */
        <div className="flex-1 flex flex-col min-h-0 bg-obsidian/40">
          {/* Messages Scroll Area */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-zinc-500">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-zinc-400" />
                </div>
                <p className="text-xs font-medium text-zinc-300">No messages yet</p>
                <p className="text-[11px] text-zinc-500">
                  Say hello to team members in room <span className="font-mono text-cyan-400">{roomId}</span>
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === currentUser?.id;
                const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
                  >
                    {/* Header info */}
                    <div className="flex items-center space-x-1.5 mb-1 px-1 text-[11px]">
                      {!isMe && (
                        <span
                          className="font-semibold"
                          style={{ color: msg.senderColor }}
                        >
                          {msg.senderName}
                        </span>
                      )}
                      {isMe && (
                        <span className="font-semibold text-cyan-400">
                          You
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-500">{timeStr}</span>
                    </div>

                    {/* Bubble */}
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs break-words shadow-sm leading-relaxed ${
                        isMe
                          ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-500/30 rounded-tr-none'
                          : 'bg-obsidian-card text-zinc-200 border border-white/8 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Field */}
          <form
            onSubmit={handleSend}
            className="p-2.5 border-t border-obsidian-border bg-obsidian/90 flex items-center space-x-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type message... (Enter to send)"
              className="flex-1 glass-input px-3 py-2 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
              maxLength={1000}
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className={`p-2 rounded-xl transition-all ${
                inputText.trim()
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 shadow-glow-cyan'
                  : 'bg-white/5 text-zinc-600 border border-white/5 cursor-not-allowed'
              }`}
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════
           PARTICIPANTS TAB CONTENT
           ══════════════════════════════════════════════════════════ */
        <div className="flex-1 flex flex-col min-h-0 bg-obsidian/40 overflow-y-auto p-3 space-y-4">
          {/* Summary / Room Invite banner */}
          <div className="p-3 rounded-xl glass-panel border border-white/5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-zinc-200">Active Participants</span>
              <span className="text-[11px] text-zinc-500 font-mono">
                {users.length} connected now
              </span>
            </div>
            <button
              onClick={handleCopyInvite}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 text-cyan-300 text-xs transition-all"
              title="Copy room invite link"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Invite</span>
                </>
              )}
            </button>
          </div>

          {/* Participants List */}
          <div className="space-y-1.5">
            {users.map((user) => {
              const isMe = user.id === currentUser?.id;

              return (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl transition-all border ${
                    isMe
                      ? 'bg-cyan-500/5 border-cyan-500/20'
                      : 'bg-obsidian-card hover:bg-white/5 border-white/5'
                  }`}
                >
                  {/* Left: Avatar + Name */}
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="relative">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-black"
                        style={{ backgroundColor: user.color }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-obsidian" />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-medium text-zinc-200 truncate">
                          {user.name}
                        </span>
                        {isMe && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {user.isScreenSharing
                          ? 'Presenting'
                          : isMe
                          ? 'Local Host'
                          : 'Collaborator'}
                      </span>
                    </div>
                  </div>

                  {/* Right: Status Icons */}
                  <div className="flex items-center space-x-1.5 text-zinc-400">
                    {/* Screen share badge */}
                    {user.isScreenSharing && (
                      <div
                        className="p-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        title="Sharing Screen"
                      >
                        <ScreenShare className="w-3.5 h-3.5" />
                      </div>
                    )}

                    {/* Video indicator */}
                    <div
                      className={`p-1 rounded ${
                        !user.isVideoOff
                          ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
                          : 'text-zinc-600'
                      }`}
                      title={user.isVideoOff ? 'Camera Off' : 'Camera On'}
                    >
                      {user.isVideoOff ? (
                        <VideoOff className="w-3.5 h-3.5" />
                      ) : (
                        <Video className="w-3.5 h-3.5" />
                      )}
                    </div>

                    {/* Mic indicator */}
                    <div
                      className={`p-1 rounded ${
                        !user.isMuted
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'text-rose-400/70'
                      }`}
                      title={user.isMuted ? 'Muted' : 'Unmuted'}
                    >
                      {user.isMuted ? (
                        <MicOff className="w-3.5 h-3.5" />
                      ) : (
                        <Mic className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Connection status footer */}
          <div className="pt-2 flex items-center justify-center space-x-2 text-[11px] text-zinc-500">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>P2P Mesh WebRTC & Real-time Socket Connected</span>
          </div>
        </div>
      )}
    </aside>
  );
};
