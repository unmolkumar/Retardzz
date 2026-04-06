"use client";

import { useSharedEditor } from "./EditorContext";

export default function TopLeftControls() {
  const { editor } = useSharedEditor();

  return (
    <div className="absolute top-6 left-6 z-[9999] bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center gap-3 text-slate-200 transition-all">
      <button
        onClick={() => editor?.undo()}
        title="Undo"
        className="p-1 hover:text-white hover:bg-white/10 rounded-lg transition-colors focus:outline-none hover:scale-110 active:scale-95 flex items-center justify-center w-8 h-8"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      </button>

      <button
        onClick={() => editor?.redo()}
        title="Redo"
        className="p-1 hover:text-white hover:bg-white/10 rounded-lg transition-colors focus:outline-none hover:scale-110 active:scale-95 flex items-center justify-center w-8 h-8"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
        </svg>
      </button>

      <div className="w-[1px] h-4 bg-white/20 mx-1"></div>

      <button
        onClick={() => editor?.zoomOut()}
        title="Zoom Out"
        className="p-1 hover:text-white hover:bg-white/10 rounded-lg transition-colors focus:outline-none hover:scale-110 active:scale-95 flex items-center justify-center w-8 h-8"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
        </svg>
      </button>

      <button
        onClick={() => editor?.zoomIn()}
        title="Zoom In"
        className="p-1 hover:text-white hover:bg-white/10 rounded-lg transition-colors focus:outline-none hover:scale-110 active:scale-95 flex items-center justify-center w-8 h-8"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
        </svg>
      </button>
    </div>
  );
}
