"use client";

import { useSharedEditor } from "./EditorContext";
import { useValue } from "@tldraw/tldraw";

const tools = [
  // SVG paths for the tools
  { id: 'select', label: 'Select', icon: 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122' },
  { id: 'hand', label: 'Pan', icon: 'M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11' },
  { id: 'draw', label: 'Pen', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
  { id: 'eraser', label: 'Eraser', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
  { id: 'arrow', label: 'Arrow', icon: 'M14 5l7 7m0 0l-7 7m7-7H3' },
  { id: 'line', label: 'Line', icon: 'M5 19L19 5' },
  { id: 'geo', geo: 'rectangle', label: 'Square', icon: 'M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z' },
  { id: 'geo', geo: 'ellipse', label: 'Circle', icon: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'geo', geo: 'diamond', label: 'Diamond', icon: 'M2.201 11.265l7.922-7.922a1.038 1.038 0 011.468 0l7.922 7.922a1.038 1.038 0 010 1.468l-7.922 7.922a1.038 1.038 0 01-1.468 0l-7.922-7.922a1.038 1.038 0 010-1.468z' },
  { id: 'text', label: 'Text', icon: 'M4 6h16M4 12h16M4 18h7' },
  { id: 'note', label: 'Sticky', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
];

export default function BottomToolbar() {
  const { editor } = useSharedEditor();

  const currentToolId = useValue(
    'currentToolId',
    () => {
      if (!editor) return 'select';
      return editor.getCurrentToolId();
    },
    [editor]
  );
  
  const isGridMode = useValue(
    'isGridMode',
    () => {
      if (!editor) return false;
      return editor.getInstanceState().isGridMode;
    },
    [editor]
  );

  const handleToolChange = (toolId: string, geo?: string) => {
    if (!editor) return;
    editor.setCurrentTool(toolId);
    if (geo) {
      import('@tldraw/tldraw').then(({ DefaultGeoStyle }) => {
        editor.setStyleForNextShapes(DefaultGeoStyle, geo as any);
      });
    }
  };

  const toggleGrid = () => {
    if (!editor) return;
    editor.setGridMode(!editor.getInstanceState().isGridMode);
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex items-center gap-2 text-slate-200 transition-all">
      {tools.map((tool, idx) => (
        <button
          key={idx}
          onClick={() => handleToolChange(tool.id, tool.geo)}
          className={`flex p-2.5 rounded-xl transition-all focus:outline-none group ${
            currentToolId === tool.id && (tool.geo ? editor?.getSharedStyles().getAsKnownValue({ id: 'geo', type: 'geo' } as any) === tool.geo : true)
              ? 'bg-blue-500/30 text-blue-400 ring-1 ring-blue-500/50' 
              : 'hover:bg-white/10 hover:text-white'
          }`}
          title={tool.label}
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tool.icon} />
          </svg>
        </button>
      ))}

      <div className="w-[1px] h-6 bg-white/20 mx-2"></div>

      <button
        onClick={toggleGrid}
        className={`flex px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all focus:outline-none ${
          isGridMode 
            ? 'bg-green-500/30 text-green-400 ring-1 ring-green-500/50' 
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
        }`}
        title="Toggle Grid"
      >
        Grid
      </button>
    </div>
  );
}
