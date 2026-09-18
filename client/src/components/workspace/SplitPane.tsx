import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GripVertical } from 'lucide-react';

interface SplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
  initialSplit?: number; // percentage (0 to 100)
  minPercent?: number;
  maxPercent?: number;
}

export const SplitPane: React.FC<SplitPaneProps> = ({
  left,
  right,
  initialSplit = 50,
  minPercent = 20,
  maxPercent = 80,
}) => {
  const [splitPercent, setSplitPercent] = useState<number>(initialSplit);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const newPercent = (offsetX / rect.width) * 100;

      const clampedPercent = Math.min(Math.max(newPercent, minPercent), maxPercent);
      setSplitPercent(clampedPercent);

      // Trigger window resize event so Monaco Editor and Fabric.js canvas auto-adjust
      window.dispatchEvent(new Event('resize'));
    },
    [isDragging, minPercent, maxPercent]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      window.dispatchEvent(new Event('resize'));
    }
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const resetSplit = () => {
    setSplitPercent(50);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[calc(100vh-3.5rem)] flex flex-row overflow-hidden select-none ${
        isDragging ? 'cursor-col-resize select-none' : ''
      }`}
    >
      {/* Left Pane (Code Editor) */}
      <div
        style={{ width: `${splitPercent}%` }}
        className="h-full flex flex-col overflow-hidden relative"
      >
        {left}
      </div>

      {/* Modern Resizable Splitter Divider */}
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={resetSplit}
        className={`group relative z-20 w-2.5 flex items-center justify-center cursor-col-resize transition-colors ${
          isDragging ? 'bg-cyan-500/20' : 'hover:bg-cyan-500/10'
        } bg-obsidian-border/80`}
      >
        {/* Visual Line */}
        <div
          className={`w-[2px] h-full transition-colors ${
            isDragging
              ? 'bg-cyan-400 shadow-glow-cyan'
              : 'bg-obsidian-border group-hover:bg-cyan-500/60'
          }`}
        />

        {/* Center Pill Grab Handle */}
        <div
          className={`absolute flex flex-col items-center justify-center w-5 h-12 rounded-full glass-panel-elevated border border-obsidian-border group-hover:border-cyan-500/40 shadow-lg transition-all ${
            isDragging ? 'border-cyan-400 scale-110' : ''
          }`}
          title="Drag to resize (Double-click to center 50/50)"
        >
          <GripVertical className="w-3 h-3 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
        </div>
      </div>

      {/* Right Pane (Whiteboard) */}
      <div
        style={{ width: `${100 - splitPercent}%` }}
        className="h-full flex flex-col overflow-hidden relative"
      >
        {right}
      </div>
    </div>
  );
};
