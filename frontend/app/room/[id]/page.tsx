import VoiceChat from "../../../components/room/core/VoiceChat";
import PomodoroTimer from "../../../components/room/core/PomodoroTimer";
import AITutor from "../../../components/ai/AITutor";
import PollManager from "../../../components/polls/PollManager";
import Canvas from "../../../components/whiteboard/Canvas";

export default function RoomPage({ params }: { params: { id: string } }) {
  // Temporary hardcoded User ID until Auth is fully mounted
  const mockUserId = "temp-user-123";

  return (
    <div className="flex h-screen w-screen bg-gray-100 overflow-hidden">
      {/* Left Sidebar: AI Tutor (Member 1) */}
      <div className="w-1/4 h-full p-4 border-r bg-white shadow-sm flex flex-col">
        <h2 className="text-xl font-bold mb-4 text-blue-600">Smart AI Tutor</h2>
        <div className="flex-1 overflow-hidden relative">
          <AITutor roomId={params.id} userId={mockUserId} />
        </div>
      </div>
      
      {/* Center Main Stage */}
      <div className="w-1/2 h-full flex flex-col p-4 gap-4">
        {/* Top Center: Whiteboard (Member 4) */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col relative">
          <div className="bg-purple-500 text-white text-sm font-bold px-4 py-1">Collaborative Canvas</div>
          <div className="flex-1 relative">
            <Canvas roomId={params.id} userId={mockUserId} />
          </div>
        </div>
        
        {/* Bottom Center: Polls (Member 2) */}
        <div className="h-1/3 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col relative">
          <div className="bg-green-500 text-white text-sm font-bold px-4 py-1">Live Group Polls</div>
          <div className="flex-1 overflow-auto relative">
            <PollManager roomId={params.id} userId={mockUserId} />
          </div>
        </div>
      </div>
      
      {/* Right Sidebar: Core Controls (Member 3) */}
      <div className="w-1/4 h-full p-4 border-l bg-white shadow-sm flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold mb-1 text-red-600">Room Hub</h2>
          <p className="text-xs text-gray-500 bg-gray-100 p-2 rounded">Room ID: {params.id}</p>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg flex flex-col gap-4">
          {/* Member 3 Components */}
          <PomodoroTimer roomId={params.id} />
          <VoiceChat roomId={params.id} userId={mockUserId} />
        </div>

        {/* Future space for Participant List (Member 3 focus) */}
        <div className="flex-1 border-t pt-4">
          <h3 className="font-bold text-gray-700 text-sm mb-2">Room Members</h3>
          <div className="text-xs text-gray-400 italic">Participant list rendering slot...</div>
        </div>
      </div>
    </div>
  );
}
