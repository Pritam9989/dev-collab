import { Server, Socket } from 'socket.io';

export function registerWebRTCHandlers(io: Server, socket: Socket) {
  // WebRTC Offer relay between peers
  const handleOffer = ({ targetId, offer }: { targetId: string; offer: any }) => {
    if (!targetId || !offer) return;
    const payload = { senderId: socket.id, offer };
    io.to(targetId).emit('offer', payload);
    io.to(targetId).emit('webrtc:offer', payload);
  };

  socket.on('offer', handleOffer);
  socket.on('webrtc:offer', handleOffer);

  // WebRTC Answer relay back to offering peer
  const handleAnswer = ({ targetId, answer }: { targetId: string; answer: any }) => {
    if (!targetId || !answer) return;
    const payload = { senderId: socket.id, answer };
    io.to(targetId).emit('answer', payload);
    io.to(targetId).emit('webrtc:answer', payload);
  };

  socket.on('answer', handleAnswer);
  socket.on('webrtc:answer', handleAnswer);

  // WebRTC ICE Candidate exchange
  const handleIceCandidate = ({ targetId, candidate }: { targetId: string; candidate: any }) => {
    if (!targetId || !candidate) return;
    const payload = { senderId: socket.id, candidate };
    io.to(targetId).emit('ice-candidate', payload);
    io.to(targetId).emit('webrtc:ice-candidate', payload);
  };

  socket.on('ice-candidate', handleIceCandidate);
  socket.on('webrtc:ice-candidate', handleIceCandidate);
}
