# Architecture & System Design

## 1. Tech Stack

- **Frontend:** Next.js (React), Tailwind CSS, TypeScript
- **Backend (Core & Real-time):** Node.js, Express, Socket.io (for real-time whiteboard, polling, and voice signaling)
- **Backend (AI Tutor):** Python, FastAPI, LangChain/OpenAI API
- **Database:** PostgreSQL (via Prisma ORM) or Supabase (for quick auth & DB)

## 2. Database Schema (Prisma / PostgreSQL)

```prisma
model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  rooms     RoomMember[]
}

model Room {
  id        String   @id @default(uuid())
  name      String
  hostId    String
  members   RoomMember[]
  polls     Poll[]
}

model RoomMember {
  userId    String
  roomId    String
  role      String   // "HOST" or "GUEST"
  @@id([userId, roomId])
}

model Poll {
  id        String   @id @default(uuid())
  roomId    String
  question  String
  options   PollOption[]
}

model PollOption {
  id        String   @id @default(uuid())
  pollId    String
  text      String
  votes     Int      @default(0)
}
// AI context and Whiteboard shapes handled via unstructured JSON or separate isolated tables.
```

## 3. Frozen API & Socket Contracts

**DO NOT CHANGE WITHOUT TEAM AGREEMENT.**

### REST APIs

- `POST /api/rooms` -> `{ name, hostId }` -> Returns `{ roomId }`
- `GET /api/rooms/:id` -> Returns Room Details
- `POST /api/ai/chat` -> `{ userId, message, context }` -> Returns `{ reply }`

### Socket.io Events

- **Room:** `join-room(roomId, userId)` -> broadcasts `user-joined`
- **Polls:** `poll:create(pollData)` -> broadcasts `poll:sync(pollData)`, `poll:vote(optionId)` -> broadcasts `poll:updateVotes(pollData)`
- **Whiteboard:** `whiteboard:draw(metadata)` -> broadcasts `whiteboard:sync(metadata)`
