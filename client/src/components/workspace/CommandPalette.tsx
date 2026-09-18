import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Moon,
  Sun,
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  LogOut,
  Copy,
  Trash2,
  Code2,
  Columns,
  Check,
  Sparkles,
  MessageSquare,
  Users,
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../types/index.js';

export interface CommandItem {
  id: string;
  title: string;
  description: string;
  category: 'Editor' | 'Media' | 'Whiteboard' | 'Room';
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: string;
  onToggleTheme: () => void;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
  isVideoMuted: boolean;
  onToggleVideo: () => void;
  isScreenSharing: boolean;
  onToggleScreenShare: () => void;
  onLeaveRoom: () => void;
  onClearCanvas: () => void;
  onFormatCode?: () => void;
  onResetSplit?: () => void;
  currentLanguage: string;
  onSelectLanguage: (lang: string) => void;
  onToggleChat?: () => void;
  onToggleParticipants?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onToggleTheme,
  isAudioMuted,
  onToggleAudio,
  isVideoMuted,
  onToggleVideo,
  isScreenSharing,
  onToggleScreenShare,
  onLeaveRoom,
  onClearCanvas,
  onFormatCode,
  onResetSplit,
  currentLanguage,
  onSelectLanguage,
  onToggleChat,
  onToggleParticipants,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => {
      setCopiedLink(false);
      onClose();
    }, 1000);
  };

  // Commands List
  const commands: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [
      // Theme
      {
        id: 'toggle-theme',
        title: `Switch Theme to ${currentTheme === 'vs-dark' ? 'Obsidian Black' : 'VS Dark'}`,
        description: `Current theme: ${currentTheme.toUpperCase()}`,
        category: 'Editor',
        icon: currentTheme === 'vs-dark' ? <Moon className="w-4 h-4 text-cyan-400" /> : <Sun className="w-4 h-4 text-amber-400" />,
        shortcut: 'T',
        action: () => {
          onToggleTheme();
          onClose();
        },
      },
      // Audio
      {
        id: 'toggle-audio',
        title: isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone',
        description: isAudioMuted ? 'Turn on audio stream' : 'Silence your microphone',
        category: 'Media',
        icon: isAudioMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-cyan-400" />,
        shortcut: 'M',
        action: () => {
          onToggleAudio();
          onClose();
        },
      },
      // Video
      {
        id: 'toggle-video',
        title: isVideoMuted ? 'Turn On Camera' : 'Turn Off Camera',
        description: isVideoMuted ? 'Stream webcam video to peers' : 'Disable webcam video',
        category: 'Media',
        icon: isVideoMuted ? <VideoOff className="w-4 h-4 text-rose-400" /> : <Video className="w-4 h-4 text-violet-400" />,
        shortcut: 'V',
        action: () => {
          onToggleVideo();
          onClose();
        },
      },
      // Screen Share
      {
        id: 'toggle-screen',
        title: isScreenSharing ? 'Stop Screen Share' : 'Share Screen',
        description: isScreenSharing ? 'End active screen broadcast' : 'Present a window or entire screen',
        category: 'Media',
        icon: <ScreenShare className="w-4 h-4 text-emerald-400" />,
        shortcut: 'S',
        action: () => {
          onToggleScreenShare();
          onClose();
        },
      },
      // Whiteboard Clear
      {
        id: 'clear-whiteboard',
        title: 'Clear Whiteboard Canvas',
        description: 'Erase all shapes and drawing strokes across all peers',
        category: 'Whiteboard',
        icon: <Trash2 className="w-4 h-4 text-amber-400" />,
        action: () => {
          onClearCanvas();
          onClose();
        },
      },
      // Copy Link
      {
        id: 'copy-link',
        title: copiedLink ? 'Copied to Clipboard!' : 'Copy Room Invite Link',
        description: 'Share this link with teammates to collaborate in real-time',
        category: 'Room',
        icon: copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />,
        shortcut: 'C',
        action: handleCopyLink,
      },
      // Reset Split
      {
        id: 'reset-split',
        title: 'Reset Split-Pane (50/50)',
        description: 'Evenly distribute space between Code Editor and Whiteboard',
        category: 'Editor',
        icon: <Columns className="w-4 h-4 text-zinc-400" />,
        action: () => {
          if (onResetSplit) onResetSplit();
          onClose();
        },
      },
      // Format Code
      {
        id: 'format-code',
        title: 'Format Code Document',
        description: 'Auto-indent and format code syntax',
        category: 'Editor',
        icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
        action: () => {
          if (onFormatCode) onFormatCode();
          onClose();
        },
      },
      // Leave Room
      {
        id: 'leave-room',
        title: 'Leave Workspace Room',
        description: 'Disconnect from the session and return to the landing page',
        category: 'Room',
        icon: <LogOut className="w-4 h-4 text-rose-400" />,
        action: () => {
          onLeaveRoom();
          onClose();
        },
      },
      // Open Chat
      {
        id: 'open-chat',
        title: 'Open Team Chat',
        description: 'Send and view real-time messages in this room',
        category: 'Room',
        icon: <MessageSquare className="w-4 h-4 text-cyan-400" />,
        shortcut: 'H',
        action: () => {
          if (onToggleChat) onToggleChat();
          onClose();
        },
      },
      // View Peers
      {
        id: 'open-participants',
        title: 'View Active Peers & Status',
        description: 'Inspect connected users, audio, video and presenting status',
        category: 'Room',
        icon: <Users className="w-4 h-4 text-violet-400" />,
        shortcut: 'P',
        action: () => {
          if (onToggleParticipants) onToggleParticipants();
          onClose();
        },
      },
    ];

    // Language options
    SUPPORTED_LANGUAGES.forEach((lang) => {
      list.push({
        id: `lang-${lang.id}`,
        title: `Set Language: ${lang.name}`,
        description: currentLanguage === lang.id ? 'Active syntax mode' : `Switch editor syntax to ${lang.name}`,
        category: 'Editor',
        icon: <Code2 className={`w-4 h-4 ${currentLanguage === lang.id ? 'text-cyan-400' : 'text-zinc-500'}`} />,
        action: () => {
          onSelectLanguage(lang.id);
          onClose();
        },
      });
    });

    return list;
  }, [
    currentTheme,
    onToggleTheme,
    isAudioMuted,
    onToggleAudio,
    isVideoMuted,
    onToggleVideo,
    isScreenSharing,
    onToggleScreenShare,
    onClearCanvas,
    onFormatCode,
    onResetSplit,
    onLeaveRoom,
    copiedLink,
    currentLanguage,
    onSelectLanguage,
    onClose,
  ]);

  // Filtered commands based on search
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const lower = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(lower) ||
        cmd.description.toLowerCase().includes(lower) ||
        cmd.category.toLowerCase().includes(lower)
    );
  }, [commands, query]);

  // Keyboard Navigation inside Command Palette
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Command Palette Card */}
      <div className="relative w-full max-w-xl rounded-2xl glass-panel-elevated shadow-2xl border border-white/10 overflow-hidden z-10 animate-fade-in flex flex-col max-h-[70vh]">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-obsidian-border bg-obsidian-card/80">
          <Search className="w-4 h-4 text-cyan-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search actions..."
            className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none"
          />
          <div className="flex items-center space-x-1.5 ml-2">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-white/10 text-zinc-400 border border-white/10">
              ESC
            </kbd>
          </div>
        </div>

        {/* Command List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              No matching commands found
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  data-index={idx}
                  onClick={() => cmd.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-500/15 border border-cyan-500/30 text-white shadow-sm'
                      : 'hover:bg-white/5 border border-transparent text-zinc-300'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <div
                      className={`p-1.5 rounded-lg transition-colors ${
                        isSelected ? 'bg-cyan-500/20' : 'bg-white/5'
                      }`}
                    >
                      {cmd.icon}
                    </div>
                    <div className="flex flex-col truncate text-left">
                      <span className="text-xs font-medium text-zinc-200 truncate">
                        {cmd.title}
                      </span>
                      <span className="text-[11px] text-zinc-500 truncate">
                        {cmd.description}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-3 flex-shrink-0">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/5 text-zinc-500">
                      {cmd.category}
                    </span>
                    {cmd.shortcut && (
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-white/10 text-zinc-400 border border-white/10">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-obsidian-border bg-obsidian/90 flex items-center justify-between text-[11px] text-zinc-500 select-none">
          <div className="flex items-center space-x-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-zinc-600">DevCollab</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-cyan-400 font-mono text-[10px]">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>
    </div>
  );
};
