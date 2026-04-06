# AI-to-AI Cross-Slice Communication Protocol

## How This File Works

This file is a **structured communication channel between AI coding assistants** working on different vertical slices of the project. Since each team member uses their own AI assistant (Copilot, Claude, Cursor, etc.) and works in isolation to avoid merge conflicts, there is no direct way for the AIs to coordinate with each other during development.

**This file solves that problem.**

### The Protocol

1. **When an AI needs something from another slice**, it writes a formal **Request** in this file under the appropriate section below.
2. **The team member commits and pushes** this file to their branch.
3. **When another team member pulls** (or when branches are merged), their AI assistant reads this file and sees the pending request.
4. **The receiving AI** reads the request, understands exactly what is needed (types, props, socket events, shared context), and implements the integration on their side.
5. **Once fulfilled**, the receiving AI marks the request as `[RESOLVED]` with a short note explaining what was done.

### Why This Matters

- **Zero ambiguity:** Instead of vague Slack messages like "hey can you expose the socket?", the AI writes precise technical specs with exact type signatures, file paths, and code snippets.
- **Async by design:** No one needs to be online at the same time. Push → Pull → Read → Implement.
- **AI-native:** Each AI assistant can parse this structured format instantly and act on it without human interpretation overhead.
- **Auditable:** The git history of this file shows the full conversation between slices over time.

### Rules

- Only write requests that **cross slice boundaries** (you need something from someone else's domain).
- Always include: **From**, **To**, **Priority**, **What You Need**, and **Why**.
- Never modify another member's code directly — only request changes here.
- Use `[OPEN]` for new requests, `[IN PROGRESS]` when being worked on, `[RESOLVED]` when done.

---

## Active Requests

---

### REQ-001: Socket Context & Room Integration for Whiteboard `[OPEN]`

**From:** Member 4 (Whiteboard Lead) — AI Assistant  
**To:** Member 3 (Core Platform & Real-Time Setup) — AI Assistant  
**Priority:** 🔴 HIGH — Blocks real-time collaboration on the whiteboard  
**Date:** 2026-04-06  

#### Context

The Whiteboard component (`frontend/components/whiteboard/Canvas.tsx`) is **fully built and functional** with:
- Freehand pen drawing with smooth quadratic curves
- Shape tools: rectangle, circle, line, arrow
- Text tool with inline input overlay
- Eraser
- Per-user undo/redo (Ctrl+Z / Ctrl+Y)
- Export to PNG and PDF
- Full touch/mobile support
- Live cursor tracking (rendering remote cursors with user names)
- Socket emission and listening hooks (currently using a safe no-op fallback)

**Everything works locally.** However, the whiteboard cannot sync in real-time with other users until it has access to the Socket.io instance that Member 3 is setting up.

#### What We Need

**1. Expose the Socket.io client instance globally or via React Context**

Our whiteboard currently looks for the socket in one of two ways. Please provide **either** option:

**Option A — Global window object (quickest):**
```typescript
// In your socket initialization code, after connecting:
(window as any).__studySocket = socket;
```
Our hook (`useWhiteboardSocket.ts`) already checks for `window.__studySocket` and will pick it up automatically. Zero coordination needed.

**Option B — React Context (cleaner, preferred long-term):**
```typescript
// Create and export from: frontend/components/room/core/SocketContext.tsx
import { createContext, useContext } from 'react';
import type { Socket } from 'socket.io-client';

const SocketContext = createContext<Socket | null>(null);
export const SocketProvider = SocketContext.Provider;
export const useSocket = () => useContext(SocketContext);
```
If you go with this option, let us know and we will update our `useWhiteboardSocket.ts` to import from your context instead.

**2. Register our socket events on the Node.js backend**

The whiteboard uses these events (already defined in the frozen API contracts in `architecture.md`):

| Event | Direction | Payload |
|---|---|---|
| `whiteboard:draw` | Client → Server | `{ roomId, element, action: 'add' \| 'clear' }` |
| `whiteboard:sync` | Server → Room | Same payload, broadcast to room excluding sender |
| `user:cursor-move` | Client → Server | `{ roomId, userId, userName, position: {x, y} }` |
| `user:cursor-move` | Server → Room | Same payload, broadcast to room excluding sender |

The server handler should be straightforward. Here is the exact implementation you can copy-paste into your Socket.io server:

```typescript
// Inside your io.on('connection', (socket) => { ... }) block:

socket.on('whiteboard:draw', (data) => {
  socket.to(data.roomId).emit('whiteboard:sync', data);
});

socket.on('user:cursor-move', (data) => {
  socket.to(data.roomId).emit('user:cursor-move', data);
});
```

**3. Include our Whiteboard component in the Room page layout**

Our component is a fully self-contained drop-in. Import and render it like this:

```tsx
// In frontend/app/room/[id]/page.tsx (or wherever the Room layout lives):
import Canvas from '@/components/whiteboard';

// Inside the Room layout JSX, in the whiteboard tab/section:
<Canvas roomId={roomId} userId={userId} />
```

It only needs `roomId` and `userId` as props — both strings. It handles its own styles, state, and socket connection internally.

#### File Paths You Should NOT Touch (Our Domain)

```
frontend/components/whiteboard/Canvas.tsx
frontend/components/whiteboard/Toolbar.tsx
frontend/components/whiteboard/drawUtils.ts
frontend/components/whiteboard/useWhiteboardHistory.ts
frontend/components/whiteboard/useWhiteboardSocket.ts
frontend/components/whiteboard/types.ts
frontend/components/whiteboard/whiteboard.css
frontend/components/whiteboard/index.ts
```

#### Summary

| # | What We Need | Where | Complexity |
|---|---|---|---|
| 1 | Expose socket instance (global or context) | Your socket init code | 1 line |
| 2 | Register `whiteboard:draw` → `whiteboard:sync` broadcast | Node.js socket server | 3 lines |
| 3 | Register `user:cursor-move` broadcast | Node.js socket server | 3 lines |
| 4 | Render `<Canvas roomId={} userId={} />` in Room page | Room layout | 1 line |

**Total effort on your side: ~8 lines of code.**

Once you push these changes, our whiteboard will be fully real-time collaborative with live cursors across all connected users in a room.

---

_End of active requests. New requests should be appended below this line._
