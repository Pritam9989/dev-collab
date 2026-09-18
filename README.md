<div align="center">

# 🚀 DevCollab

**A real-time collaborative coding workspace — built with React, Node.js, Socket.io, and Monaco Editor.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-010101?logo=socket.io)](https://socket.io/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

<p align="center">
  <a href="https://render.com/deploy?repo=https://github.com/Pritam9989/dev-collab">
    <img src="https://render.com/images/deploy-to-render-button.svg" alt="Deploy to Render" />
  </a>
  &nbsp;&nbsp;
  <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FPritam9989%2Fdev-collab">
    <img src="https://vercel.com/button" alt="Deploy with Vercel" />
  </a>
</p>

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| **Real-time Code Sync** | Live collaborative editing via Socket.io — every keystroke synced across all peers |
| **Monaco Editor** | VS Code-grade editor with syntax highlighting for 10+ languages |
| **Multi-User Cursors** | Floating colored cursor flags with usernames for each connected peer |
| **Language Boilerplates** | Auto-inject starter code when switching languages (Python, JS, TS, C++, Java, Go, Rust…) |
| **Code Execution Engine** | Run code in-browser (JS/TS sandbox) or via Piston API cloud runner (Python, C++, Java, Go, Rust) |
| **Terminal Output Panel** | Collapsible terminal with green stdout / red stderr, timing, memory, and engine badges |
| **Real-time Group Chat** | Persistent room chat with message history, unread badge counter, and auto-scroll |
| **Active Participants Panel** | Live list of all connected devs with mic/camera/screen-share status icons |
| **WebRTC Audio/Video Calls** | Peer-to-peer calling with mute, camera toggle, screen share, speaking detection |
| **Collaborative Whiteboard** | Shared Fabric.js canvas for diagrams and sketches |
| **Command Palette** | `Ctrl+K` quick-access to all workspace actions |

---

## 🛠️ Tech Stack

**Frontend**
- React 19 + TypeScript + Vite
- Monaco Editor (`@monaco-editor/react`)
- Socket.io Client
- Tailwind CSS with custom Obsidian Dark theme
- Lucide React icons
- Fabric.js (whiteboard)

**Backend**
- Node.js + Express + TypeScript
- Socket.io Server
- Piston API integration (cloud code execution)
- Local `child_process` runners for JS/Python fallback

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/dev-collab.git
cd dev-collab

# Install all workspace dependencies
npm install
```

### Run in Development

```bash
npm run dev
```

This starts both services concurrently:

| Service | URL |
|---|---|
| 🖥️ Frontend (React + Vite) | http://localhost:5173 |
| ⚙️ Backend (Node.js + Socket.io) | http://localhost:4000 |

### Build for Production

```bash
npm run build --workspace=server
npm run build --workspace=client
```

### Run Tests

```bash
# Requires the server to be running (npm run dev)
npm test
```

---

## 📁 Project Structure

```
dev-collab/
├── client/                          # React frontend
│   └── src/
│       ├── components/
│       │   └── workspace/
│       │       ├── CodeEditor.tsx   # Monaco editor with cursors, run button, terminal
│       │       ├── Terminal.tsx     # Code execution output panel
│       │       ├── SideDrawer.tsx   # Chat + Participants side panel
│       │       ├── FloatingAvatars.tsx # WebRTC video call dock
│       │       ├── Navbar.tsx       # Top navigation bar
│       │       └── CommandPalette.tsx  # Ctrl+K quick actions
│       ├── hooks/
│       │   └── useWebRTC.ts         # WebRTC peer connection hook
│       ├── pages/
│       │   └── WorkspacePage.tsx    # Main workspace page
│       ├── services/
│       │   └── codeRunner.ts        # Client-side code execution (iframe + API)
│       └── types/
│           ├── index.ts             # Shared types + SUPPORTED_LANGUAGES
│           └── boilerplates.ts      # Language starter templates
│
├── server/                          # Node.js backend
│   └── src/
│       ├── socket/
│       │   ├── roomHandler.ts       # Room join/leave, participant tracking
│       │   ├── codeHandler.ts       # Code sync + cursor presence relay
│       │   ├── chatHandler.ts       # Real-time group chat
│       │   ├── canvasHandler.ts     # Whiteboard sync
│       │   └── webrtcHandler.ts     # WebRTC signaling (offer/answer/ICE)
│       ├── routes/
│       │   └── executeHandler.ts    # POST /api/execute
│       ├── services/
│       │   └── executionService.ts  # Piston API + local runner + fallback
│       └── index.ts                 # Express + Socket.io server entry
│
├── test-backend.js                  # Automated backend socket tests (7/7)
└── package.json                     # Monorepo workspace config
```

---

## 🎯 Usage

1. Open **http://localhost:5173**
2. Enter a room name and your display name → **Create / Join Room**
3. Share the URL with teammates — they join the same room instantly
4. Start coding together in the Monaco editor
5. Press **▶ Run** or `Ctrl+Enter` to execute code
6. Click the **💬 chat icon** to open the team chat panel
7. Click the **🎤 mic** or **📷 camera** buttons in the floating dock to start a call

---

## 📄 License

MIT © DevCollab
