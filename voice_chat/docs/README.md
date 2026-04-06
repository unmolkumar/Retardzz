# 🎙️ Voice Chat Module (LiveKit)

This is a standalone Next.js micro-app that provides real-time, Discord-style audio rooms for the **Smart Student Study Manager**. It is built using [LiveKit](https://livekit.io/) to handle WebRTC routing securely and reliably.

## ✨ Features
- **Zero-Latency Audio:** Powered by LiveKit's global edge network.
- **Discord-Style HUD:** Glassmorphism UI with a floating grid of participants.
- **Active Speaker Detection:** Highlights users when they are talking.
- **Drop-in Integration:** Packaged as a single `<VoiceRoom />` component for easy integration into the main Study Room Hub.

## 🛠 Tech Stack
- **Framework:** Next.js (App Router)
- **WebRTC Engine:** LiveKit (`livekit-client`, `@livekit/components-react`)
- **Styling:** Tailwind CSS
- **Auth:** LiveKit Server SDK (Token Generation)

---

## 🚀 Local Development Setup

Because this is an isolated module, you must run it from within the `/voice_chat` directory.

### 1. Install Dependencies
```bash
cd voice_chat
npm install
```

### 2. Environment Variables

You need LiveKit API keys to route the audio. Create a `.env.local` file in the root of the `voice_chat` folder and add your keys from the LiveKit Cloud Dashboard:

```env
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project-url.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
```

(Note: Never commit `.env.local` to GitHub!)

### 3. Run the Development Server

```bash
npm run dev
```

The standalone testing page will be available at http://localhost:3000 (or 3001 if the main frontend is running).

## 🧩 Integration Guide (For Main Frontend)

When the main Study Room Hub is ready, follow these steps to integrate the voice chat:

1. Copy `src/components/VoiceRoom.tsx` into the main `frontend/src/components/` folder.
2. Copy the token generation route `src/app/api/livekit/route.ts` into the main `frontend/src/app/api/` folder.
3. Add the `.env.local` LiveKit keys to the main frontend environment.
4. Import and render the room:

```tsx
import { VoiceRoom } from "@/components/VoiceRoom";

export default function StudyRoomPage() {
  return (
    <div className="flex">
      <MainCanvas />
      <div className="absolute top-4 left-4 z-50">
        <VoiceRoom roomId="physics-study-group-1" username="Student123" />
      </div>
    </div>
  );
}
```

---

### What this accomplishes:
1. **Sets the standard:** Your teammate immediately knows what tech stack you used and what environment variables they need.
2. **Provides the blueprint:** The "Integration Guide" at the bottom means you don't have to spend time explaining how to wire it up when the time comes.