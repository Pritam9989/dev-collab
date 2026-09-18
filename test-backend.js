import { io } from 'socket.io-client';

const SERVER_PORT = 4000;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;
const TEST_ROOM = 'test-room-' + Math.random().toString(36).slice(2, 7);

async function runTests() {
  console.log('--- Starting Backend Verification Tests ---');

  // 1. Health check HTTP endpoint
  console.log('[1/5] Testing GET /api/health ...');
  const healthRes = await fetch(`${SERVER_URL}/api/health`);
  const healthData = await healthRes.json();
  if (healthData.status !== 'ok') {
    throw new Error(`Health check failed: ${JSON.stringify(healthData)}`);
  }
  console.log('✓ Health check passed:', healthData);

  // 2. Room Management & Peer Join/Leave
  console.log('[2/5] Testing Room Management & Peer Join/Leave ...');
  const client1 = io(SERVER_URL, { transports: ['websocket'] });
  const client2 = io(SERVER_URL, { transports: ['websocket'] });

  await new Promise((resolve) => client1.on('connect', resolve));
  await new Promise((resolve) => client2.on('connect', resolve));
  console.log(`Connected client1: ${client1.id}, client2: ${client2.id}`);

  // Client 1 joins
  const roomStatePromise = new Promise((resolve) => {
    client1.on('room-state', (state) => resolve(state));
  });
  client1.emit('join-room', { roomId: TEST_ROOM, userName: 'Alice' });
  const roomState = await roomStatePromise;
  if (!roomState || roomState.roomId !== TEST_ROOM) {
    throw new Error('Failed to receive valid room state');
  }
  console.log(`✓ Client 1 joined room '${TEST_ROOM}' successfully`);

  // Client 2 joins -> Client 1 should receive 'user-joined'
  const userJoinedPromise = new Promise((resolve) => {
    client1.on('user-joined', (user) => resolve(user));
  });
  client2.emit('join-room', { roomId: TEST_ROOM, userName: 'Bob' });
  const joinedUser = await userJoinedPromise;
  if (joinedUser.id !== client2.id || joinedUser.name !== 'Bob') {
    throw new Error('User joined event payload mismatch');
  }
  console.log(`✓ Client 1 received user-joined event for Bob (${joinedUser.id})`);

  // 3. Code Editor Sync (code-change relay)
  console.log('[3/5] Testing Code Editor Sync (code-change) ...');
  const testCode = 'const devCollab = "rock solid";';
  const codeChangePromise = new Promise((resolve) => {
    client2.on('code-change', (data) => resolve(data));
  });
  client1.emit('code-change', { roomId: TEST_ROOM, code: testCode });
  const codeEvent = await codeChangePromise;
  if (codeEvent.code !== testCode || codeEvent.senderId !== client1.id) {
    throw new Error(`Code sync mismatch: ${JSON.stringify(codeEvent)}`);
  }
  console.log('✓ Client 2 received code-change event from Client 1 with exact payload');

  // 4. Whiteboard Sync (drawing-data & clear-canvas relay)
  console.log('[4/5] Testing Whiteboard Sync (drawing-data & clear-canvas) ...');
  const testDrawing = JSON.stringify({ version: '5.3.0', objects: [{ type: 'circle', radius: 20 }] });
  const drawingPromise = new Promise((resolve) => {
    client2.on('drawing-data', (data) => resolve(data));
  });
  client1.emit('drawing-data', { roomId: TEST_ROOM, data: testDrawing });
  const drawEvent = await drawingPromise;
  if (drawEvent.data !== testDrawing || drawEvent.senderId !== client1.id) {
    throw new Error(`Drawing data mismatch: ${JSON.stringify(drawEvent)}`);
  }
  console.log('✓ Client 2 received drawing-data event successfully');

  const clearCanvasPromise = new Promise((resolve) => {
    client2.on('clear-canvas', (data) => resolve(data));
  });
  client1.emit('clear-canvas', { roomId: TEST_ROOM });
  const clearEvent = await clearCanvasPromise;
  if (clearEvent.senderId !== client1.id) {
    throw new Error(`Clear canvas sender mismatch: ${JSON.stringify(clearEvent)}`);
  }
  console.log('✓ Client 2 received clear-canvas event successfully');

  // 5. WebRTC Signaling (offer, answer, ice-candidate relay)
  console.log('[5/5] Testing WebRTC Signaling (offer, answer, ice-candidate) ...');
  const offerPayload = { type: 'offer', sdp: 'dummy-sdp-offer' };
  const offerPromise = new Promise((resolve) => {
    client2.on('offer', (data) => resolve(data));
  });
  client1.emit('offer', { targetId: client2.id, offer: offerPayload });
  const offerReceived = await offerPromise;
  if (offerReceived.senderId !== client1.id || offerReceived.offer.sdp !== 'dummy-sdp-offer') {
    throw new Error(`Offer relay mismatch: ${JSON.stringify(offerReceived)}`);
  }
  console.log('✓ Client 2 received WebRTC offer from Client 1');

  const answerPayload = { type: 'answer', sdp: 'dummy-sdp-answer' };
  const answerPromise = new Promise((resolve) => {
    client1.on('answer', (data) => resolve(data));
  });
  client2.emit('answer', { targetId: client1.id, answer: answerPayload });
  const answerReceived = await answerPromise;
  if (answerReceived.senderId !== client2.id || answerReceived.answer.sdp !== 'dummy-sdp-answer') {
    throw new Error(`Answer relay mismatch: ${JSON.stringify(answerReceived)}`);
  }
  console.log('✓ Client 1 received WebRTC answer from Client 2');

  const candidatePayload = { candidate: 'candidate:1 1 UDP 12345 192.168.1.1 50000 typ host' };
  const candidatePromise = new Promise((resolve) => {
    client2.on('ice-candidate', (data) => resolve(data));
  });
  client1.emit('ice-candidate', { targetId: client2.id, candidate: candidatePayload });
  const candidateReceived = await candidatePromise;
  if (candidateReceived.senderId !== client1.id || candidateReceived.candidate.candidate !== candidatePayload.candidate) {
    throw new Error(`Candidate relay mismatch: ${JSON.stringify(candidateReceived)}`);
  }
  console.log('✓ Client 2 received WebRTC ice-candidate from Client 1');

  // 6. Real-time Group Chat Messaging
  console.log('[6/7] Testing Chat Messaging (chat:message & history) ...');
  const chatPromise = new Promise((resolve) => {
    client2.on('chat:message', (msg) => resolve(msg));
  });
  client1.emit('chat:message', { roomId: TEST_ROOM, text: 'Hello team!' });
  const receivedMsg = await chatPromise;
  if (!receivedMsg || receivedMsg.text !== 'Hello team!' || receivedMsg.senderId !== client1.id) {
    throw new Error(`Chat message relay mismatch: ${JSON.stringify(receivedMsg)}`);
  }
  console.log(`✓ Client 2 received chat:message from Client 1 (${receivedMsg.senderName}: "${receivedMsg.text}")`);

  // 7. Collaborative Cursor & Selection Presence
  console.log('[7/7] Testing Cursor & Selection Presence (cursor-move & cursor-update) ...');
  const cursorPromise = new Promise((resolve) => {
    client2.on('cursor-update', (data) => resolve(data));
  });
  client1.emit('cursor-move', {
    roomId: TEST_ROOM,
    position: { lineNumber: 12, column: 5 },
    selection: { startLineNumber: 12, startColumn: 1, endLineNumber: 12, endColumn: 10 },
  });
  const cursorEvent = await cursorPromise;
  if (
    !cursorEvent ||
    cursorEvent.userId !== client1.id ||
    cursorEvent.position.lineNumber !== 12 ||
    !cursorEvent.user ||
    !cursorEvent.selection
  ) {
    throw new Error(`Cursor presence mismatch: ${JSON.stringify(cursorEvent)}`);
  }
  console.log(`✓ Client 2 received cursor-update for ${cursorEvent.user.name} (${cursorEvent.user.color}) at Ln 12, Col 5 with selection`);

  // Test user leave
  const userLeftPromise = new Promise((resolve) => {
    client1.on('user-left', (data) => resolve(data));
  });
  client2.emit('leave-room', { roomId: TEST_ROOM });
  const leftEvent = await userLeftPromise;
  if (leftEvent.userId !== client2.id) {
    throw new Error(`User left mismatch: ${JSON.stringify(leftEvent)}`);
  }
  console.log('✓ Client 1 received user-left event when Client 2 left');

  client1.disconnect();
  client2.disconnect();

  console.log('\n========================================');
  console.log('🎉 ALL BACKEND SOCKET, WEBRTC & CHAT TESTS PASSED!');
  console.log('========================================\n');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
