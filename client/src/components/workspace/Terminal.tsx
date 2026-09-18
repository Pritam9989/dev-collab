import React, { useRef, useEffect } from 'react';
import {
  Terminal as TerminalIcon,
  X,
  Trash2,
  ChevronDown,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Clock,
} from 'lucide-react';
import { ExecutionResult } from '../../services/codeRunner.js';

interface TerminalProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  result: ExecutionResult | null;
  isRunning: boolean;
  language: string;
  onClear: () => void;
}

export const Terminal: React.FC<TerminalProps> = ({
  isOpen,
  onToggle,
  onClose,
  result,
  isRunning,
  language,
  onClear,
}) => {
  const outputRef = useRef<HTMLDivElement>(null);

  // Auto-scroll output to bottom when new result arrives
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [result, isRunning]);

  if (!isOpen) return null;

  const formatSeconds = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div
      aria-label="Code Output Terminal"
      className="border-t border-obsidian-border bg-[#08080a] flex flex-col transition-all duration-200 select-none z-20"
      style={{ height: '220px' }}
    >
      {/* ── Terminal Header Bar ── */}
      <div className="h-8 px-3 border-b border-white/5 bg-[#0e0e12] flex items-center justify-between text-xs">
        {/* Left: Terminal Icon + Title + Language */}
        <div className="flex items-center space-x-2">
          <TerminalIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-zinc-200 text-xs tracking-wide">Terminal</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-white/5 text-zinc-400 border border-white/10 uppercase">
            {language}
          </span>

          {/* Running indicator */}
          {isRunning && (
            <div className="flex items-center space-x-1 text-cyan-400 text-[11px] animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Running...</span>
            </div>
          )}

          {/* Status summary when done */}
          {!isRunning && result && (
            <div className="flex items-center space-x-2 pl-2 border-l border-white/10">
              {result.exitCode === 0 ? (
                <span className="flex items-center space-x-1 text-emerald-400 text-[11px]">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Success (exit 0)</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-rose-400 text-[11px]">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Failed (exit {result.exitCode})</span>
                </span>
              )}

              {/* Execution time */}
              <span className="flex items-center space-x-1 text-zinc-400 text-[11px] font-mono">
                <Clock className="w-3 h-3 text-zinc-500" />
                <span>Exited in {formatSeconds(result.executionTime)}</span>
              </span>

              {/* Memory */}
              {result.memory && (
                <span className="hidden sm:flex items-center space-x-1 text-zinc-400 text-[11px] font-mono">
                  <Cpu className="w-3 h-3 text-zinc-500" />
                  <span>{result.memory}</span>
                </span>
              )}

              {/* Engine Badge */}
              {result.engine && (
                <span className="hidden md:inline px-1 rounded text-[9px] font-mono bg-white/5 text-zinc-500 border border-white/5">
                  {result.engine}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Actions (Clear, Minimize, Close) */}
        <div className="flex items-center space-x-1">
          {/* Clear Console */}
          <button
            onClick={onClear}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Clear Console Output"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Minimize / Toggle */}
          <button
            onClick={onToggle}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Minimize Terminal"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {/* Close Panel */}
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Close Terminal"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Terminal Output Area ── */}
      <div
        ref={outputRef}
        className="flex-1 p-3 font-mono text-xs overflow-y-auto select-text space-y-1 bg-[#09090c]"
      >
        {/* Empty state */}
        {!isRunning && !result && (
          <div className="h-full flex items-center justify-center text-zinc-600 text-xs italic select-none">
            Click "Run" (or press Ctrl + Enter) to execute your code
          </div>
        )}

        {/* Running state placeholder */}
        {isRunning && !result && (
          <div className="flex items-center space-x-2 text-cyan-400 text-xs py-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-mono">Executing {language.toUpperCase()} script...</span>
          </div>
        )}

        {/* Output rendering */}
        {result && (
          <div className="space-y-1 leading-relaxed">
            {/* Standard Output (Green) */}
            {result.stdout && (
              <pre className="text-emerald-400 whitespace-pre-wrap break-words font-mono">
                {result.stdout}
              </pre>
            )}

            {/* Standard Error (Red/Rose) */}
            {result.stderr && (
              <pre className="text-rose-400 whitespace-pre-wrap break-words font-mono">
                {result.stderr}
              </pre>
            )}

            {/* If both stdout and stderr are empty */}
            {!result.stdout && !result.stderr && (
              <div className="text-zinc-500 italic">
                (Program executed cleanly with no standard output)
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
