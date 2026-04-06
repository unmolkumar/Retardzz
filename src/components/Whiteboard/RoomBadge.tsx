"use client";

import { useState, useEffect } from "react";

export default function RoomBadge() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[9999] bg-slate-900/80 backdrop-blur-md border border-slate-700/50 shadow-2xl rounded-full px-6 py-2 flex items-center gap-3 transition-all hover:bg-slate-800/90 text-white">
      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
      <span className="font-bold text-white text-sm tracking-wide">Study Room #1</span>
      <span className="w-1 h-1 rounded-full bg-slate-400"></span>
      <span className="font-mono text-xs text-slate-300 font-semibold">{formatTime(seconds)}</span>
    </div>
  );
}
