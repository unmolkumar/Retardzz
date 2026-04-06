import VoiceChat from "../../../components/room/core/VoiceChat";
import PomodoroTimer from "../../../components/room/core/PomodoroTimer";
import AITutor from "../../../components/ai/AITutor";
import PollManager from "../../../components/polls/PollManager";
import Canvas from "../../../components/whiteboard/Canvas";

export default function RoomPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex h-screen p-4 gap-4 bg-gray-100">
      <div className="w-1/4 h-full flex flex-col gap-4">
        <AITutor roomId={params.id} userId="temp-user" />
      </div>
      <div className="w-1/2 h-full flex flex-col gap-4">
        <div className="h-2/3"><Canvas roomId={params.id} userId="temp-user" /></div>
        <div className="h-1/3"><PollManager roomId={params.id} userId="temp-user" /></div>
      </div>
      <div className="w-1/4 h-full border-2 border-red-500 rounded p-4 bg-white">
        <h2>Room <h2>Room & Voice (Member 3)</h2><p>Room ID: {params.id}</p> Voice (Member 3)</h2>
<p className="mb-4">Room ID: {params.id}</p>
<PomodoroTimer roomId={params.id} />
<VoiceChat roomId={params.id} userId="temp-user" />
      </div>
    </div>
  );
}
