import { useState, useEffect } from "react";
import { useSocket } from "./useSocket";

export default function PomodoroTimer({ roomId }: { roomId: string }) {
  const socket = useSocket();
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"WORK" | "BREAK">("WORK");

  useEffect(() => {
    if (!socket) return;

    socket.on("timer:sync", (data: { timeLeft: number; isRunning: boolean; mode: "WORK" | "BREAK" }) => {
      setTimeLeft(data.timeLeft);
      setIsRunning(data.isRunning);
      setMode(data.mode);
    });

    return () => {
      socket.off("timer:sync");
    };
  }, [socket]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      // Auto-switch mode
      const nextMode = mode === "WORK" ? "BREAK" : "WORK";
      const nextTime = nextMode === "WORK" ? 25 * 60 : 5 * 60;
      setMode(nextMode);
      setTimeLeft(nextTime);
      setIsRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, mode]);

  const handleStartPause = () => {
    const newState = !isRunning;
    setIsRunning(newState);
    if (socket) {
      socket.emit("timer:state-change", { roomId, timeLeft, isRunning: newState, mode });
    }
  };

  const handleReset = () => {
    const defaultTime = mode === "WORK" ? 25 * 60 : 5 * 60;
    setIsRunning(false);
    setTimeLeft(defaultTime);
    if (socket) {
      socket.emit("timer:state-change", { roomId, timeLeft: defaultTime, isRunning: false, mode });
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="p-4 bg-white border-2 border-red-500 rounded text-center">
      <h3 className="text-xl font-bold mb-2">Pomodoro ({mode})</h3>
      <div className="text-4xl font-mono mb-4">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </div>
      <div className="flex gap-2 justify-center">
        <button 
          onClick={handleStartPause}
          className="px-4 py-2 bg-red-500 text-white rounded font-bold"
        >
          {isRunning ? "Pause" : "Start"}
        </button>
        <button 
          onClick={handleReset}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded font-bold"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
