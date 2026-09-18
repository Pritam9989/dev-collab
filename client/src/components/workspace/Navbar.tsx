import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Code2,
  Copy,
  Check,
  Users,
  LogOut,
  Share2,
  MessageSquare,
} from 'lucide-react';
import { User } from '../../types/index.js';

interface NavbarProps {
  roomId: string;
  users: User[];
  currentUser: User | null;
  isConnected: boolean;
  onToggleChat?: () => void;
  onToggleParticipants?: () => void;
  unreadCount?: number;
  isDrawerOpen?: boolean;
  activeTab?: 'chat' | 'participants';
}

export const Navbar: React.FC<NavbarProps> = ({
  roomId,
  users,
  currentUser: _currentUser,
  isConnected,
  onToggleChat,
  onToggleParticipants,
  unreadCount = 0,
  isDrawerOpen = false,
  activeTab = 'chat',
}) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = () => {
    navigate('/');
  };

  return (
    <header className="h-14 border-b border-obsidian-border bg-obsidian/90 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & Room Info */}
      <div className="flex items-center space-x-4">
        <div
          onClick={() => navigate('/')}
          className="flex items-center space-x-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 flex items-center justify-center group-hover:border-cyan-400/60 transition-all duration-300">
            <Code2 className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="font-semibold text-sm tracking-wide text-zinc-100 hidden sm:inline">
            Dev<span className="text-cyan-400 font-bold">Collab</span>
          </span>
        </div>

        <div className="h-4 w-[1px] bg-obsidian-border hidden sm:block" />

        {/* Room ID Tag */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center space-x-2 px-2.5 py-1 rounded-md glass-panel hover:border-cyan-500/40 text-xs font-mono text-zinc-300 transition-all group"
            title="Click to copy room link"
          >
            <span className="text-zinc-500 text-[10px]">ROOM:</span>
            <span className="text-cyan-300 font-medium">{roomId}</span>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 animate-fade-in" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
            )}
          </button>
        </div>

        {/* Sync Status Badge */}
        <div className="hidden md:flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{isConnected ? 'Realtime Synced' : 'Connecting...'}</span>
        </div>
      </div>

      {/* Right Controls: Chat, Active Users & Leave */}
      <div className="flex items-center space-x-2.5">
        {/* Chat Toggle Button with Unread Badge */}
        <button
          onClick={onToggleChat}
          className={`relative flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            isDrawerOpen && activeTab === 'chat'
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-glow-cyan'
              : 'glass-button text-zinc-300 hover:text-white'
          }`}
          title="Toggle Chat Panel"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Chat</span>
          {unreadCount > 0 && (
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-cyan-400 text-black animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Participants Pill - Opens Drawer to Participants Tab */}
        <button
          onClick={onToggleParticipants}
          className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            isDrawerOpen && activeTab === 'participants'
              ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
              : 'glass-button text-zinc-300 hover:text-white'
          }`}
          title="View Participants"
        >
          <Users className="w-3.5 h-3.5 text-zinc-400" />
          <span>{users.length} Online</span>
          {/* Tiny stacked avatar dots */}
          <div className="flex -space-x-1.5 ml-0.5">
            {users.slice(0, 3).map((u) => (
              <div
                key={u.id}
                className="w-4 h-4 rounded-full border border-obsidian text-[8px] flex items-center justify-center font-bold text-black"
                style={{ backgroundColor: u.color }}
                title={u.name}
              >
                {u.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {users.length > 3 && (
              <div className="w-4 h-4 rounded-full bg-zinc-700 border border-obsidian text-[8px] flex items-center justify-center text-zinc-300">
                +{users.length - 3}
              </div>
            )}
          </div>
        </button>

        {/* Share Button */}
        <button
          onClick={handleCopyLink}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-medium transition-all"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{copied ? 'Link Copied!' : 'Invite'}</span>
        </button>

        {/* Leave Workspace Button */}
        <button
          onClick={handleLeave}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title="Leave Workspace"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
