import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Mic, MicOff, Video, VideoOff, ScreenShare, ScreenShareOff,
  Radio, AlertCircle, X, Maximize2, Minimize2, PhoneOff,
} from 'lucide-react';
import { User } from '../../types/index.js';

// ─── Props ────────────────────────────────────────────────────────────────────
interface FloatingAvatarsProps {
  currentUser: User | null;
  peers: User[];
  localStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
  isSpeaking?: boolean;
  mediaError: string | null;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onLeaveRoom?: () => void;
}

// ─── VideoTile — attaches a MediaStream to a <video> element ─────────────────
interface VideoTileProps {
  stream: MediaStream;
  isLocal?: boolean;
  className?: string;
  muted?: boolean;
}

const VideoTile: React.FC<VideoTileProps> = ({ stream, isLocal, className = '', muted }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.srcObject !== stream) {
      el.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isLocal || muted}
      className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''} ${className}`}
    />
  );
};

// ─── AvatarInitial ────────────────────────────────────────────────────────────
const AvatarInitial: React.FC<{ name: string; color: string; size?: 'sm' | 'lg' }> = ({
  name, color, size = 'sm',
}) => (
  <div
    className={`w-full h-full flex items-center justify-center font-bold select-none ${size === 'lg' ? 'text-2xl' : 'text-xs'}`}
    style={{ backgroundColor: color, color: '#fff' }}
  >
    {name.charAt(0).toUpperCase()}
  </div>
);

// ─── MediaStatusDot ───────────────────────────────────────────────────────────
const MediaStatusDot: React.FC<{ isMuted: boolean; isSpeaking?: boolean }> = ({ isMuted, isSpeaking }) => (
  <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center shadow-sm">
    {isMuted ? (
      <MicOff className="w-2.5 h-2.5 text-rose-400" />
    ) : isSpeaking ? (
      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
    ) : (
      <Mic className="w-2.5 h-2.5 text-emerald-400" />
    )}
  </div>
);

// ─── ControlButton ─────────────────────────────────────────────────────────────
interface CtrlBtnProps {
  onClick: () => void;
  active: boolean;
  activeClass?: string;
  inactiveClass?: string;
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}
const ControlButton: React.FC<CtrlBtnProps> = ({
  onClick, active, activeClass, inactiveClass, title, children, danger,
}) => {
  const base =
    'relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-transparent';
  const cls = danger
    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25 hover:bg-rose-500/30 hover:text-rose-300 focus:ring-rose-500/50'
    : active
    ? activeClass || 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 shadow-glow-cyan'
    : inactiveClass || 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20';

  return (
    <button onClick={onClick} title={title} className={`${base} ${cls}`}>
      {children}
    </button>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const FloatingAvatars: React.FC<FloatingAvatarsProps> = ({
  currentUser,
  peers,
  localStream,
  remoteStreams,
  isAudioMuted,
  isVideoMuted,
  isScreenSharing,
  isSpeaking = false,
  mediaError,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onLeaveRoom,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [dismissedError, setDismissedError] = useState(false);

  const otherPeers = peers.filter((p) => p.id !== currentUser?.id);
  const hasAnyStream = !!localStream || Object.keys(remoteStreams).length > 0;
  const shouldShowExpand = hasAnyStream && (otherPeers.length > 0 || !isVideoMuted);

  const handleToggleExpand = useCallback(() => setExpanded((e) => !e), []);

  // ── Expanded "video grid" overlay ────────────────────────────────────────
  const ExpandedGrid = () => {
    const allTiles: Array<{ key: string; label: string; color: string; stream: MediaStream | null; isLocal: boolean; isMuted: boolean; isSpeaking?: boolean; isScreenSharing?: boolean }> = [];

    if (currentUser) {
      allTiles.push({
        key: 'local',
        label: currentUser.name,
        color: currentUser.color,
        stream: localStream,
        isLocal: true,
        isMuted: isAudioMuted,
        isSpeaking,
      });
    }

    otherPeers.forEach((peer) => {
      allTiles.push({
        key: peer.id,
        label: peer.name,
        color: peer.color,
        stream: remoteStreams[peer.id] || null,
        isLocal: false,
        isMuted: peer.isMuted,
        isScreenSharing: peer.isScreenSharing,
      });
    });

    const gridCols =
      allTiles.length === 1 ? 'grid-cols-1' :
      allTiles.length <= 2 ? 'grid-cols-2' :
      allTiles.length <= 4 ? 'grid-cols-2' :
      'grid-cols-3';

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-black/85 backdrop-blur-xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/8">
          <div className="flex items-center space-x-2">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-sm font-medium text-zinc-200">
              Live Call &mdash; {allTiles.length} participant{allTiles.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={handleToggleExpand}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/8 transition-colors"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Video Grid */}
        <div className={`flex-1 grid ${gridCols} gap-2 p-3 overflow-auto`}>
          {allTiles.map((tile) => {
            const showVideo = tile.isLocal
              ? (!isVideoMuted && !!tile.stream)
              : (!!tile.stream && tile.stream.getVideoTracks().some((t) => t.readyState === 'live'));

            return (
              <div
                key={tile.key}
                className={`relative rounded-2xl overflow-hidden bg-obsidian-card border transition-all duration-300 animate-tile-in shadow-video-tile ${
                  !tile.isMuted && tile.isSpeaking
                    ? 'border-cyan-400 animate-speaking-ring'
                    : 'border-white/8'
                }`}
                style={{ minHeight: 160 }}
              >
                {showVideo ? (
                  <VideoTile stream={tile.stream!} isLocal={tile.isLocal} className="absolute inset-0" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden">
                      <AvatarInitial name={tile.label} color={tile.color} size="lg" />
                    </div>
                  </div>
                )}
                {/* Name tag */}
                <div className="absolute bottom-2 left-2 flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm">
                  <span className="text-xs font-medium text-white">{tile.label}</span>
                  {tile.isLocal && <span className="text-[10px] text-cyan-400">You</span>}
                  {tile.isScreenSharing && <ScreenShare className="w-3 h-3 text-emerald-400" />}
                </div>
                <MediaStatusDot isMuted={!!tile.isMuted} isSpeaking={tile.isSpeaking} />
              </div>
            );
          })}
        </div>

        {/* Controls inside expanded view */}
        <div className="flex items-center justify-center space-x-3 px-5 py-4 border-t border-white/8">
          <ControlButton
            onClick={onToggleAudio}
            active={!isAudioMuted}
            activeClass="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 shadow-glow-cyan"
            inactiveClass="bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
            title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </ControlButton>
          <ControlButton
            onClick={onToggleVideo}
            active={!isVideoMuted}
            activeClass="bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30 shadow-glow-violet"
            inactiveClass="bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
            title={isVideoMuted ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isVideoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
          </ControlButton>
          <ControlButton
            onClick={onToggleScreenShare}
            active={isScreenSharing}
            activeClass="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
            inactiveClass="text-zinc-400 border border-white/10 hover:text-white hover:bg-white/5"
            title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
          >
            {isScreenSharing ? <ScreenShareOff className="w-4 h-4" /> : <ScreenShare className="w-4 h-4" />}
          </ControlButton>
          {onLeaveRoom && (
            <ControlButton onClick={onLeaveRoom} active={false} danger title="Leave Room">
              <PhoneOff className="w-4 h-4" />
            </ControlButton>
          )}
        </div>
      </div>
    );
  };

  // ── Compact bottom dock (default view) ───────────────────────────────────
  return (
    <>
      {/* Error banner */}
      {mediaError && !dismissedError && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 flex items-center space-x-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 animate-slide-up shadow-lg">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="max-w-xs truncate">{mediaError}</span>
          <button
            onClick={() => setDismissedError(true)}
            className="ml-1 text-rose-400/60 hover:text-rose-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Expanded video grid */}
      {expanded && <ExpandedGrid />}

      {/* Compact dock */}
      <aside
        aria-label="Call Controls"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center space-x-2 px-3 py-2 rounded-2xl glass-panel-elevated shadow-glass border border-white/10 animate-slide-up"
      >
        {/* ── Controls ── */}
        <div className="flex items-center space-x-1.5 pr-3 border-r border-white/8">
          {/* Mic */}
          <button
            onClick={onToggleAudio}
            title={isAudioMuted ? 'Unmute' : 'Mute'}
            className={`relative p-2.5 rounded-xl transition-all duration-200 ${
              !isAudioMuted && isSpeaking
                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400 animate-speaking-ring'
                : isAudioMuted
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 shadow-glow-cyan'
            }`}
          >
            {isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {/* Live speaking pulse ring */}
            {!isAudioMuted && isSpeaking && (
              <span className="absolute inset-0 rounded-xl border-2 border-cyan-400 opacity-60 animate-ping" />
            )}
          </button>

          {/* Camera */}
          <button
            onClick={onToggleVideo}
            title={isVideoMuted ? 'Turn Camera On' : 'Turn Camera Off'}
            className={`p-2.5 rounded-xl transition-all duration-200 ${
              isVideoMuted
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                : 'bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30 shadow-glow-violet'
            }`}
          >
            {isVideoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
          </button>

          {/* Screen share */}
          <button
            onClick={onToggleScreenShare}
            title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
            className={`p-2.5 rounded-xl transition-all duration-200 ${
              isScreenSharing
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-zinc-400 border border-white/8 hover:text-white hover:bg-white/5'
            }`}
          >
            {isScreenSharing ? <ScreenShareOff className="w-4 h-4" /> : <ScreenShare className="w-4 h-4" />}
          </button>
        </div>

        {/* ── Avatar pill stack ── */}
        <div className="flex items-center space-x-2">
          {/* Local user pill */}
          {currentUser && (
            <div
              className={`relative flex items-center space-x-2 pl-1 pr-2.5 py-1 rounded-xl border transition-all duration-300 cursor-default ${
                !isAudioMuted && isSpeaking
                  ? 'border-cyan-400 bg-cyan-500/5'
                  : 'border-white/10 bg-obsidian-card'
              }`}
            >
              {/* Video/Avatar thumb */}
              <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-black/50 flex-shrink-0">
                {!isVideoMuted && localStream ? (
                  <VideoTile stream={localStream} isLocal className="absolute inset-0" />
                ) : (
                  <AvatarInitial name={currentUser.name} color={currentUser.color} />
                )}
                <MediaStatusDot isMuted={isAudioMuted} isSpeaking={isSpeaking} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-zinc-200 truncate max-w-[70px]">{currentUser.name}</span>
                <span className="text-[10px] text-cyan-400 font-mono">You</span>
              </div>
            </div>
          )}

          {/* Remote peer pills */}
          {otherPeers.map((peer) => {
            const stream = remoteStreams[peer.id];
            const peerHasVideo = !!stream && stream.getVideoTracks().some((t) => t.readyState === 'live' && t.enabled);

            return (
              <div
                key={peer.id}
                className={`relative flex items-center space-x-2 pl-1 pr-2.5 py-1 rounded-xl border transition-all duration-300 cursor-default animate-tile-in ${
                  !peer.isMuted
                    ? 'border-emerald-400/60 bg-emerald-500/5'
                    : 'border-white/10 bg-obsidian-card'
                }`}
              >
                <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-black/50 flex-shrink-0">
                  {peerHasVideo ? (
                    <VideoTile stream={stream!} className="absolute inset-0" />
                  ) : (
                    <AvatarInitial name={peer.name} color={peer.color} />
                  )}
                  <MediaStatusDot isMuted={peer.isMuted} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium text-zinc-200 truncate max-w-[70px]">{peer.name}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {peer.isScreenSharing ? '📺 Screen' : 'Peer'}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {otherPeers.length === 0 && (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-white/4 border border-dashed border-white/10 text-[11px] text-zinc-500">
              <Radio className="w-3 h-3 text-cyan-400/60 animate-pulse" />
              <span>Waiting for peers</span>
            </div>
          )}
        </div>

        {/* ── Expand / Leave ── */}
        <div className="flex items-center space-x-1.5 pl-3 border-l border-white/8">
          {shouldShowExpand && (
            <button
              onClick={handleToggleExpand}
              title="Expand call view"
              className="p-2 rounded-xl text-zinc-400 border border-white/8 hover:text-white hover:bg-white/5 transition-all"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onLeaveRoom && (
            <button
              onClick={onLeaveRoom}
              title="Leave room"
              className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/25 transition-all"
            >
              <PhoneOff className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
