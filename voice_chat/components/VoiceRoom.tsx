'use client';

import {
  LiveKitRoom,
  RoomAudioRenderer,
  ControlBar,
  useParticipants,
  useIsSpeaking,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { useEffect, useState } from 'react';

// A tiny sub-component to show each user with an "Active Speaker" ring
function ParticipantAvatar({ participant }: { participant: any }) {
  const isSpeaking = useIsSpeaking(participant);

  // Check if they are actually publishing audio so we know if mic is on
  const isAudioEnabled = participant.isMicrophoneEnabled;

  // Safeguard: Check if identity exists before grabbing the first letter
  const initial = participant.identity ? participant.identity[0].toUpperCase() : "?";
  const displayName = participant.identity || "Connecting...";

  return (
    <div className="flex flex-col items-center gap-3 relative">
      {/* GLOWING EFFECT BEHIND AVATAR WHEN SPEAKING */}
      {isSpeaking && (
        <div className="absolute inset-0 top-0 left-0 bg-green-500 blur-xl opacity-60 rounded-full animate-pulse z-0 scale-125" />
      )}
      
      <div 
        className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white transition-all duration-300 relative z-10
        ${isSpeaking ? 'bg-slate-800 ring-4 ring-green-400 scale-110 shadow-[0_0_25px_rgba(74,222,128,0.8)]' : 
          (isAudioEnabled ? 'bg-slate-800 ring-2 ring-slate-600' : 'bg-red-900/50 ring-2 ring-red-500/50 opacity-75')} 
        ${participant.isLocal ? 'border-4 border-indigo-500/50' : ''}`}
      >
        {initial}
        
        {/* Muted icon indicator */}
        {!isAudioEnabled && (
          <div className="absolute -bottom-1 -right-1 bg-red-600 rounded-full p-1 shadow-lg z-20 border border-slate-900 border-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <line x1="1" y1="1" x2="23" y2="23"></line>
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          </div>
        )}
      </div>
      <span className="text-sm font-bold text-slate-200 z-10 bg-slate-900/50 px-3 py-1 rounded-full backdrop-blur-sm shadow-md">
        {displayName} {participant.isLocal && "(You)"}
      </span>
    </div>
  );
}

// The main grid that maps through everyone in the room
function ParticipantGrid() {
  const participants = useParticipants(); // Includes both local and remote
  
  // Create a cool glowing border if any participant is currently speaking
  const anySpeaking = participants.some((p) => p.isSpeaking);

  return (
    <div className={`flex flex-wrap gap-8 justify-center p-12 min-h-[300px] items-center rounded-2xl border transition-all duration-500 relative overflow-hidden
      ${anySpeaking ? 'bg-slate-800/80 border-green-500/50 shadow-[0_0_40px_rgba(34,197,94,0.15)]' : 'bg-slate-800/40 border-white/5 shadow-inner'}
    `}>
      {/* Background ambient glow if someone is talking */}
      {anySpeaking && (
        <div className="absolute inset-0 bg-green-900/10 mix-blend-screen animate-pulse pointer-events-none" />
      )}

      {participants.map((p) => (
        <ParticipantAvatar key={p.identity} participant={p} />
      ))}
      {participants.length === 0 && (
        <div className="flex flex-col items-center gap-4 text-slate-500 animate-pulse">
          <div className="w-12 h-12 border-4 border-slate-600 border-t-slate-400 rounded-full animate-spin"></div>
          <p>Waiting to join room...</p>
        </div>
      )}
    </div>
  );
}

// The wrapper component that handles the connection
export function VoiceRoom({ roomId, username }: { roomId: string, username: string }) {
  const [token, setToken] = useState("");
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(`/api/livekit?room=${roomId}&username=${username}`);
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.error("Failed to fetch token:", e);
      }
    })();
  }, [roomId, username]);

  if (token === "") {
    return (
      <div className="flex items-center justify-center p-12 bg-slate-900 rounded-2xl border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
        <div className="animate-pulse text-indigo-400 font-semibold text-lg flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-indigo-500 animate-ping"></div>
          Negotiating Secure Channel...
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-900 rounded-2xl border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.2)] max-w-lg mx-auto gap-6 transition-all duration-500">
        <h2 className="text-2xl font-bold text-white">Join Secure Voice Room</h2>
        <p className="text-slate-400 text-center">Your browser requires interaction to enable microphone access. Click the button below to join the channel.</p>
        <button 
          onClick={() => setConnected(true)}
          className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white rounded-full font-bold text-lg shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] transition-all duration-300 flex items-center gap-3 transform hover:scale-105"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
          Connect Microphone & Join
        </button>
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={false}
      audio={true}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      connect={true}
      data-lk-theme="default"
      className="flex flex-col gap-6 bg-slate-900 p-8 rounded-3xl border border-indigo-900/50 shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-3xl w-full mx-auto font-sans relative"
    >
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h2 className="text-white text-xl font-bold flex items-center gap-3">
          {/* Main "Live" indicator glow */}
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 shadow-[0_0_10px_rgba(74,222,128,1)]"></span>
          </span>
          {roomId}
        </h2>
        <span className="text-xs bg-indigo-950/80 text-indigo-200 border border-indigo-500/30 px-3 py-1.5 rounded-full font-medium tracking-wide shadow-[0_0_10px_rgba(99,102,241,0.2)]">
          LiveKit Encrypted
        </span>
      </div>

      {/* Renders the UI Grid */}
      <ParticipantGrid />

      {/* Actually plays the audio */}
      <RoomAudioRenderer />

      {/* LiveKit's pre-built Mute/Disconnect buttons */}
      <div className="flex justify-center mt-4 bg-slate-950/50 py-3 rounded-2xl border border-white/5 backdrop-blur-md">
        <ControlBar 
          variation="minimal" 
          controls={{ microphone: true, screenShare: false, camera: false, chat: false }} 
        />
      </div>
    </LiveKitRoom>
  );
}