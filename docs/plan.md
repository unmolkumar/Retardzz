# Project Plan & Task Distribution

To avoid merge conflicts, the application is divided into strict vertical slices. Each member owns a specific domain front-to-back (UI + API + DB).

---

## Member 1

**Role:** AI Developer
**Scope:** AI Tutor Chat, Context Memory, Flashcard Generation.
**Directory Focus:** `frontend/components/ai/`, `backend-ai/` (FastAPI)
**Zero Conflict Guarantee:** No one else touches the AI backend or the AI UI components.

### Task Checklist

- [ ] Initialize Python FastAPI backend skeleton for the AI Tutor
- [ ] Research and configure LangChain/OpenAI API integration limits
- [ ] Build the AI Tutor chat UI component in React/Next.js
- [ ] Connect the UI form submission to the FastAPI backend
- [ ] Implement context memory capability (storing/retrieving history)
- [ ] Create flashcard generation logic (converting notes to Q&A)
- [ ] Build flashcard review user interface
- [ ] Test integration with global auth context

---

## Member 2

**Role:** Polls & Interactive Elements Developer
**Scope:** Polling System (UI, state, and real-time socket events for voting).
**Directory Focus:** `frontend/components/polls/`
**Zero Conflict Guarantee:** Operates strictly within the Polls isolated component and specific socket handlers.

### Task Checklist

- [ ] Design the Poll Creation UI (questions and input for options)
- [ ] Build the active poll view UI (displaying questions/options to users)
- [ ] Add real-time event emission: `poll:create` to the Node backend
- [ ] Add real-time event listening: trigger UI updates on `poll:sync`
- [ ] Add vote submit functionality: emit `poll:vote` event
- [ ] Build a live results view (bar charts updating upon vote)
- [ ] Integrate completed Polls component into the main Room page frame
- [ ] Ensure Poll UI only shows host functionalities to the room host

---

## Member 3

**Role:** Core Platform & Real-Time Setup
**Scope:** Room Creation/Join flow, WebRTC Voice Chat setup, Auth integration, Pomodoro Timer.
**Directory Focus:** `frontend/components/room/core/`, `frontend/app/room/[id]`
**Zero Conflict Guarantee:** Focuses on the skeleton, auth, and voice. Other members plug their components into this foundation.

### Task Checklist

- [ ] Bootstrap the Next.js, Tailwind, and project file structure
- [ ] Set up PostgreSQL/Prisma database connection
- [ ] Integrate user authentication (Google Login / NextAuth)
- [ ] Build full Room creation to join flow (database persistence)
- [ ] Initialize the main Socket.io Node server
- [ ] Set up basic Socket connection logic for clients joining rooms
- [ ] Implement WebRTC configuration for Voice Chat
- [ ] Set up mute/unmute and push-to-talk toggles for voice
- [ ] Build the Pomodoro Timer module (logic + UI synced across room)
- [ ] Create the Room Page layout slots for everyone's components to live in

---

## Member 4

**Role:** Whiteboard & Canvas Developer
**Scope:** Real-Time Collaborative Whiteboard (drawing tools, cursors, sync).
**Directory Focus:** `frontend/components/whiteboard/`
**Zero Conflict Guarantee:** Self-contained canvas component.

### Task Checklist

- [ ] Research and initialize the underlying Canvas framework
- [ ] Create the interactive UI toolbar (colors, tools, sizes)
- [ ] Implement local freehand drawing functionality
- [ ] Implement shape drawing functionality
- [ ] Link canvas actions to Socket emissions (`whiteboard:draw`)
- [ ] Listen for incoming socket draw events and render them
- [ ] Implement live cursor tracking (`user:cursor-move`)
- [ ] Add local State management for Undo/Redo functions
- [ ] Add "Export to PNG/PDF" functionality
- [ ] Verify the whiteboard fits seamlessly in the main Room component
