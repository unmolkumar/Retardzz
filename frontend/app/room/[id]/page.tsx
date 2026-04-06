"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import VoiceChat from "../../../components/room/core/VoiceChat";
import PomodoroTimer from "../../../components/room/core/PomodoroTimer";
import ParticipantList from "../../../components/room/core/ParticipantList";
import AITutor from "../../../components/ai/AITutor";
import PollManager from "../../../components/polls/PollManager";
import Canvas from "../../../components/whiteboard/Canvas";

export default function RoomPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div className="h-screen w-screen flex items-center justify-center font-bold text-xl">Loading Room...</div>;
  }

  // NextAuth stores user.id inside our NextAuth /route.ts modifications
  const currentUserId = (session?.user as any)?.id || "guest-user";

  return (
    <div className="flex h-screen w-screen bg-gray-100 overflow-hidden">
      {/* Left Sidebar: AI Tutor (Member 1) */}
      <div className="w-1/4 h-full p-4 border-r bg-white shadow-sm flex flex-col">
        <h2 className="text-xl font-bold mb-4 text-blue-600">Smart AI Tutor</h2>
        <div className="flex-1 overflow-hidden relative">
          <AITutor roomId={params.id} userId={currentUserId} />
        </div>
      </div>
      
      {/* Center Main Stage */}
      <div className="w-1/2 h-full flex flex-col p-4 gap-4">
        {/* Top Center: Whiteboard (Member 4) */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col relative">
          <div className="bg-purple-500 text-white text-sm font-bold px-4 py-1 flex justify-between">
            <span>Collaborative Canvas</span>
            {session?.user?.name && <span className="text-xs">Logged in as {session.user.name}</span>}
          </div>
          <div className="flex-1 relative">
            <Canvas roomId={params.id} userId={currentUserId} />
          </div>
        </div>
        
        {/* Bottom Center: Polls (Member 2) */}
        <div className="h-1/3 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col relative">
          <div className="bg-green-500 text-white text-sm font-bold px-4 py-1">Live Group Polls</div>
          <div className="flex-1 overflow-auto relative">
            <PollManager roomId={params.id} userId={currentUserId} />
          </div>
        </div>
      </div>
      
      {/* Right Sidebar: Core Controls (Member 3) */}
      <div className="w-1/4 h-full p-4 border-l bg-white shadow-sm flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold mb-1 text-red-600">Room Hub</h2>
          <p className="text-xs text-gray-500 bg-gray-100 p-2 rounded truncate" title={params.id}>Room ID: {params.id}</p>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg flex flex-col gap-4 shadow-inner border border-red-100 border-b-2 border-b-red-200">
          {/* Member 3 Components */}
          <PomodoroTimer roomId={params.id} />
          <VoiceChat roomId={params.id} userId={currentUserId} />
        </div>

        {/* Participant List (Member 3 focus) */}
        <div className="flex-1 border-t pt-4 flex flex-col min-h-0">
          <h3 className="font-bold text-gray-700 text-sm mb-2 flex items-center justify-between">
            <span>Room Members</span>
            <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">Live</span>
          </h3>
          <ParticipantList />
        </div>
      </div>
    </div>
  );
}
