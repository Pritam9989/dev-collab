import { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { User } from '../types/index.js';

interface WebRTCProps {
  socket: Socket | null;
  roomId: string;
  currentUser: User | null;
  peers: User[];
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export function useWebRTC({ socket, roomId, currentUser, peers }: WebRTCProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const speakingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Speaking detection via AnalyserNode
  const startSpeakingDetection = useCallback((stream: MediaStream) => {
    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser);
      audioContextRef.current = ctx;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      speakingTimerRef.current = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setIsSpeaking(avg > 12);
      }, 100);
    } catch { /* AudioContext unavailable */ }
  }, []);

  const stopSpeakingDetection = useCallback(() => {
    if (speakingTimerRef.current) {
      clearInterval(speakingTimerRef.current);
      speakingTimerRef.current = null;
    }
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    setIsSpeaking(false);
  }, []);

  // Initialize local media (called lazily on first toggle)
  const initLocalMedia = useCallback(async () => {
    try {
      setMediaError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24 } },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      // Privacy-first: start muted/camera-off
      stream.getAudioTracks().forEach((t) => (t.enabled = false));
      stream.getVideoTracks().forEach((t) => (t.enabled = false));
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsAudioMuted(true);
      setIsVideoMuted(true);
      startSpeakingDetection(stream);
      return stream;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[WebRTC] Media unavailable:', msg);
      setMediaError('Camera/mic permission denied or device not found.');
      return null;
    }
  }, [startSpeakingDetection]);

  // Cleanup a specific peer
  const cleanupPeer = useCallback((peerId: string) => {
    peerConnections.current[peerId]?.close();
    delete peerConnections.current[peerId];
    setRemoteStreams((prev) => {
      const u = { ...prev };
      delete u[peerId];
      return u;
    });
  }, []);

  // Create RTCPeerConnection for a target peer
  const createPeerConnection = useCallback(
    (targetPeerId: string) => {
      if (peerConnections.current[targetPeerId]) return peerConnections.current[targetPeerId];
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnections.current[targetPeerId] = pc;

      // Add local tracks
      localStreamRef.current?.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current!));

      pc.onicecandidate = (e) => {
        if (e.candidate && socket) {
          const payload = { targetId: targetPeerId, candidate: e.candidate };
          socket.emit('ice-candidate', payload);
          socket.emit('webrtc:ice-candidate', payload);
        }
      };

      pc.ontrack = (e) => {
        const rs = e.streams[0] || new MediaStream([e.track]);
        setRemoteStreams((prev) => ({ ...prev, [targetPeerId]: rs }));
      };

      pc.onconnectionstatechange = () => {
        if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
          cleanupPeer(targetPeerId);
        }
      };

      return pc;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [socket]
  );

  const initiateCall = useCallback(
    async (targetPeerId: string) => {
      const pc = createPeerConnection(targetPeerId);
      try {
        const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
        await pc.setLocalDescription(offer);
        socket?.emit('offer', { targetId: targetPeerId, offer });
        socket?.emit('webrtc:offer', { targetId: targetPeerId, offer });
      } catch (err) {
        console.error('[WebRTC] Offer error:', err);
      }
    },
    [createPeerConnection, socket]
  );

  // Signaling listeners
  useEffect(() => {
    if (!socket) return;

    const handleOffer = async ({ senderId, offer }: { senderId: string; offer: RTCSessionDescriptionInit }) => {
      const pc = createPeerConnection(senderId);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', { targetId: senderId, answer });
        socket.emit('webrtc:answer', { targetId: senderId, answer });
      } catch (err) { console.error('[WebRTC] handleOffer error:', err); }
    };

    const handleAnswer = async ({ senderId, answer }: { senderId: string; answer: RTCSessionDescriptionInit }) => {
      const pc = peerConnections.current[senderId];
      if (pc) {
        try { await pc.setRemoteDescription(new RTCSessionDescription(answer)); }
        catch (err) { console.error('[WebRTC] handleAnswer error:', err); }
      }
    };

    const handleIce = async ({ senderId, candidate }: { senderId: string; candidate: RTCIceCandidateInit }) => {
      const pc = peerConnections.current[senderId];
      if (pc) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); }
        catch (err) { console.error('[WebRTC] ICE error:', err); }
      }
    };

    const handleLeft = ({ userId }: { userId: string }) => cleanupPeer(userId);

    socket.on('offer', handleOffer);   socket.on('webrtc:offer', handleOffer);
    socket.on('answer', handleAnswer); socket.on('webrtc:answer', handleAnswer);
    socket.on('ice-candidate', handleIce); socket.on('webrtc:ice-candidate', handleIce);
    socket.on('user-left', handleLeft);    socket.on('user:left', handleLeft);

    return () => {
      socket.off('offer', handleOffer);   socket.off('webrtc:offer', handleOffer);
      socket.off('answer', handleAnswer); socket.off('webrtc:answer', handleAnswer);
      socket.off('ice-candidate', handleIce); socket.off('webrtc:ice-candidate', handleIce);
      socket.off('user-left', handleLeft);    socket.off('user:left', handleLeft);
    };
  }, [socket, createPeerConnection, cleanupPeer]);

  // Auto-initiate calls when peers list changes
  useEffect(() => {
    if (!socket || !currentUser) return;
    peers.forEach((peer) => {
      if (peer.id !== currentUser.id && !peerConnections.current[peer.id] && currentUser.id > peer.id) {
        initiateCall(peer.id);
      }
    });
  }, [peers, currentUser, socket, initiateCall]);

  // Toggle Audio
  const toggleAudio = useCallback(async () => {
    const stream = localStreamRef.current || (await initLocalMedia());
    if (!stream) return;
    const tracks = stream.getAudioTracks();
    if (!tracks.length) return;
    const next = !tracks[0].enabled;
    tracks.forEach((t) => (t.enabled = next));
    setIsAudioMuted(!next);
    socket?.emit('user:media-state', { roomId, isMuted: !next });
  }, [initLocalMedia, socket, roomId]);

  // Toggle Video
  const toggleVideo = useCallback(async () => {
    const stream = localStreamRef.current || (await initLocalMedia());
    if (!stream) return;
    const tracks = stream.getVideoTracks();
    if (!tracks.length) return;
    const next = !tracks[0].enabled;
    tracks.forEach((t) => (t.enabled = next));
    setIsVideoMuted(!next);
    socket?.emit('user:media-state', { roomId, isVideoOff: !next });
  }, [initLocalMedia, socket, roomId]);

  // Toggle Screen Share
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);
      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      if (camTrack) {
        Object.values(peerConnections.current).forEach((pc) => {
          pc.getSenders().find((s) => s.track?.kind === 'video')?.replaceTrack(camTrack);
        });
      }
      socket?.emit('user:media-state', { roomId, isScreenSharing: false });
    } else {
      try {
        const ss = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        screenStreamRef.current = ss;
        const track = ss.getVideoTracks()[0];
        Object.values(peerConnections.current).forEach((pc) => {
          pc.getSenders().find((s) => s.track?.kind === 'video')?.replaceTrack(track);
        });
        track.onended = () => toggleScreenShare();
        setIsScreenSharing(true);
        socket?.emit('user:media-state', { roomId, isScreenSharing: true });
      } catch (err: unknown) { console.warn('[WebRTC] Screen share error:', err); }
    }
  }, [isScreenSharing, socket, roomId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeakingDetection();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      Object.values(peerConnections.current).forEach((pc) => pc.close());
    };
  }, [stopSpeakingDetection]);

  return {
    localStream, remoteStreams,
    isAudioMuted, isVideoMuted, isScreenSharing, isSpeaking,
    mediaError, initLocalMedia, toggleAudio, toggleVideo, toggleScreenShare,
  };
}
