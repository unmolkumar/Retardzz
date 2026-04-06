"use client";

import { useState, useEffect } from "react";
import { useSharedEditor } from "./EditorContext";
import { exportToBlob } from "@tldraw/tldraw";

export default function HeaderActions() {
  const [isOpen, setIsOpen] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const { editor } = useSharedEditor();

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

  const handleExport = async () => {
    if (!editor) return;
    const shapeIds = Array.from(editor.getCurrentPageShapeIds());
    if (shapeIds.length === 0) {
      alert("No shapes to export");
      return;
    }
    try {
      const blob = await exportToBlob({
        editor,
        ids: shapeIds,
        format: 'png',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "whiteboard-export.png";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Failed to export image.");
    }
  };

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[9999] bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-full px-6 py-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center gap-4 text-white font-sans transition-all">
      
      {/* Room Name & Timer (Left side) */}
      <div className="flex items-center gap-3 group cursor-default">
        <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)] animate-pulse"></div>
        <span className="font-bold text-sm tracking-wide">Study Room #1</span>
        <span className="font-mono text-xs text-slate-300 font-semibold bg-slate-800/50 px-2 py-0.5 rounded-md border border-white/5">{formatTime(seconds)}</span>
      </div>

      {/* Vertical Divider */}
      <div className="w-[1px] h-5 bg-white/20"></div>

      {/* Options Dropdown (Right side) */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-sm font-medium text-slate-200 hover:text-white transition-colors focus:outline-none hover:scale-105 active:scale-95"
        >
          Options
          <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="origin-top absolute right-[-20px] top-full mt-4 w-48 rounded-2xl shadow-[0_20px_40px_rgb(0,0,0,0.4)] bg-slate-900/90 backdrop-blur-2xl ring-1 ring-white/10 overflow-hidden animate-[fadeInDown_0.2s_ease-out]">
            <div className="p-2 flex flex-col gap-1">
              <button onClick={() => { handleExport(); setIsOpen(false); }} className="w-full text-left px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all hover:scale-[1.02] origin-left">
                Export Image
              </button>
              <button onClick={() => alert("Share Link copied!")} className="w-full text-left px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all hover:scale-[1.02] origin-left">
                Share Link
              </button>
              <button onClick={() => alert("Room Settings Modal")} className="w-full text-left px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all hover:scale-[1.02] origin-left">
                Room Settings
              </button>
              <div className="h-[1px] bg-white/10 my-1 mx-2"></div>
              <button 
                onClick={() => { 
                  if (!editor) return;
                  if (confirm("Clear the canvas?")) {
                    editor.selectAll().deleteShapes(editor.getSelectedShapeIds());
                    setIsOpen(false);
                  }
                }} 
                className="w-full text-left px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-xl transition-all hover:scale-[1.02] origin-left"
              >
                Clear Canvas
              </button>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}} />
    </div>
  );
}