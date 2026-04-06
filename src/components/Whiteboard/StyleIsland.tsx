"use client";

import { useState } from "react";
import { useSharedEditor } from "./EditorContext";
import { DefaultColorStyle, DefaultSizeStyle, useValue } from "@tldraw/tldraw";

const colors = [
  { name: "black", hex: "#1d1d1d" },
  { name: "grey", hex: "#7a7a7a" },
  { name: "red", hex: "#e03131" },
  { name: "light-red", hex: "#ff8787" },
  { name: "blue", hex: "#1971c2" },
  { name: "light-blue", hex: "#4dabf7" },
  { name: "green", hex: "#2b8a3e" },
  { name: "light-green", hex: "#69db7c" },
  { name: "yellow", hex: "#f08c00" },
];

const sizes = [
  { name: "s", label: "Small" },
  { name: "m", label: "Medium" },
  { name: "l", label: "Large" },
];

export default function StyleIsland() {
  const [isOpen, setIsOpen] = useState(false);
  const { editor } = useSharedEditor();

  const currentColor = useValue(
    'currentColor',
    () => {
      if (!editor) return 'black';
      const sharedStyle = editor.getSharedStyles().getAsKnownValue(DefaultColorStyle);
      return sharedStyle || 'black';
    },
    [editor]
  );

  const currentSize = useValue(
    'currentSize',
    () => {
      if (!editor) return 'm';
      const sharedStyle = editor.getSharedStyles().getAsKnownValue(DefaultSizeStyle);
      return sharedStyle || 'm';
    },
    [editor]
  );

  const activeColorHex = colors.find((c) => c.name === currentColor)?.hex || "#1d1d1d";

  const handleColorChange = (color: string) => {
    if (!editor) return;
    editor.setStyleForSelectedShapes(DefaultColorStyle, color as any);
    editor.setStyleForNextShapes(DefaultColorStyle, color as any);
  };

  const handleSizeChange = (size: string) => {
    if (!editor) return;
    editor.setStyleForSelectedShapes(DefaultSizeStyle, size as any);
    editor.setStyleForNextShapes(DefaultSizeStyle, size as any);
  };

  const handleToolChange = (toolId: string, geo?: string) => {
    if (!editor) return;
    editor.setCurrentTool(toolId);
    if (geo) {
      // For shapes, we also need to set the shape style otherwise setting to geo defaults to last geo drawn
      import('@tldraw/tldraw').then(({ DefaultGeoStyle }) => {
        editor.setStyleForNextShapes(DefaultGeoStyle, geo as any);
      });
    }
  };

  return (
    <div className="absolute top-6 right-6 z-[9999]">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center gap-3 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-full px-5 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-sm font-medium text-slate-200 hover:text-white transition-all focus:outline-none hover:scale-105 active:scale-95"
        >
          {/* Active color indicator */}
          <div 
            className="w-4 h-4 rounded-full ring-2 ring-white/20 transition-colors"
            style={{ backgroundColor: activeColorHex }}
          />
          Brush Styles
          <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="origin-top-right absolute right-0 top-full mt-4 w-64 rounded-3xl shadow-[0_20px_40px_rgb(0,0,0,0.4)] bg-slate-900/90 backdrop-blur-xl ring-1 ring-white/10 overflow-hidden animate-[fadeInDown_0.2s_ease-out] p-5">
            
            {/* Tools Section */}
            <div className="mb-4">
              <div className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Tools</div>
              <div className="grid grid-cols-3 gap-2 bg-slate-800/50 p-1.5 rounded-2xl border border-white/5">
                {[
                  { id: 'select', label: 'Select', icon: 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122' },
                  { id: 'draw', label: 'Pen', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
                  { id: 'eraser', label: 'Eraser', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
                  { id: 'geo', geo: 'rectangle', label: 'Square', icon: 'M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z' },
                  { id: 'geo', geo: 'ellipse', label: 'Circle', icon: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                  { id: 'text', label: 'Text', icon: 'M4 6h16M4 12h16M4 18h7' },
                ].map((tool, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      handleToolChange(tool.id, tool.geo);
                      setIsOpen(false);
                    }}
                    className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all focus:outline-none group"
                    title={tool.label}
                  >
                    <svg className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tool.icon} />
                    </svg>
                    <span className="text-[10px]">{tool.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[1px] bg-white/10 my-4"></div>

            {/* Colors Section */}
            <div className="mb-5">
              <div className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Colors</div>
              <div className="grid grid-cols-5 gap-2">
                {colors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => handleColorChange(c.name)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform focus:outline-none ${c.name === currentColor ? 'border-white scale-110' : 'border-transparent hover:scale-110'}`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <div className="h-[1px] bg-white/10 my-4"></div>

            {/* Stroke Size Section */}
            <div className="mb-2">
              <div className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Stroke Size</div>
              <div className="flex gap-2 bg-slate-800/50 p-1.5 rounded-full border border-white/5">
                {sizes.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => handleSizeChange(s.name)}
                    className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-all ${
                      s.name === currentSize 
                        ? 'bg-slate-700 text-white shadow-md' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
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
