import { useEffect, useState } from "react";
import { useSocket } from "./useSocket";

interface Participant {
  userId: string;
  socketId: string;
  name?: string;
}

export default function ParticipantList() {
  const socket = useSocket();
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    if (!socket) return;

    socket.on("user-joined", (user: Participant) => {
      setParticipants((prev) => [...prev.filter(p => p.socketId !== user.socketId), user]);
    });

    socket.on("user-left", ({ socketId }) => {
      setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
    });

    return () => {
      socket.off("user-joined");
      socket.off("user-left");
    };
  }, [socket]);

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-2 rounded border border-gray-200">
      {participants.length === 0 ? (
        <p className="text-gray-400 text-sm text-center mt-4">Waiting for others to join...</p>
      ) : (
        <ul className="space-y-2">
          {participants.map((p) => (
            <li key={p.socketId} className="flex items-center gap-2 p-2 bg-white rounded shadow-sm border border-gray-100">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-gray-700">{p.userId.substring(0, 8)}...</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
