import { useState, useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import { Socket } from 'socket.io-client';
import {
  Code,
  Copy,
  Check,
  AlignLeft,
  Play,
  Loader2,
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, LANGUAGE_BOILERPLATES } from '../../types/index.js';
import { Terminal } from './Terminal.js';
import { runCode as executeScript, ExecutionResult } from '../../services/codeRunner.js';

export interface CodeEditorHandle {
  formatDocument: () => void;
  setLanguage: (lang: string) => void;
  runCode?: () => void;
  getCode?: () => string;
}

export interface RemoteCursorPayload {
  userId: string;
  user: {
    id: string;
    name: string;
    color: string;
  };
  position: { lineNumber: number; column: number };
  selection?: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  } | null;
}

interface CodeEditorProps {
  roomId: string;
  socket: Socket | null;
  initialCode: string;
  initialLanguage: string;
  theme?: string; // 'vs-dark' or 'obsidian-dark'
  onLanguageChange?: (lang: string) => void;
}

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(({
  roomId,
  socket,
  initialCode,
  initialLanguage,
  theme = 'vs-dark',
  onLanguageChange,
}, ref) => {
  const [code, setCode] = useState<string>(initialCode);
  const [language, setLanguage] = useState<string>(initialLanguage || 'typescript');
  const [copied, setCopied] = useState<boolean>(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [editorReady, setEditorReady] = useState<boolean>(false);

  // Terminal & Code Execution State
  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const isLocalChange = useRef<boolean>(false);
  const handleRunCodeRef = useRef<() => void>(() => {});

  // Map to store remote user cursor widgets and selection decorations
  const remoteCursorsRef = useRef<
    Map<
      string,
      {
        widget: any;
        decorationIds: string[];
        currentPos: { lineNumber: number; column: number };
        domNode: HTMLDivElement;
        flagNode: HTMLDivElement;
      }
    >
  >(new Map());

  // Helper to remove a remote user's cursor widget & selection
  const removeRemoteCursor = useCallback((userId: string) => {
    const editor = editorRef.current;
    const existing = remoteCursorsRef.current.get(userId);
    if (existing) {
      if (editor) {
        try {
          editor.removeContentWidget(existing.widget);
          editor.deltaDecorations(existing.decorationIds, []);
        } catch {}
      }
      document.getElementById(`monaco-remote-cursor-style-${userId}`)?.remove();
      remoteCursorsRef.current.delete(userId);
    }
  }, []);

  // Helper to update or render a remote user's cursor and selection
  const updateRemoteCursor = useCallback((data: RemoteCursorPayload) => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco || !data.position) return;
    if (socket && data.userId === socket.id) return; // ignore self

    // 1. Ensure dynamic CSS class exists for this user's selection color
    const styleId = `monaco-remote-cursor-style-${data.userId}`;
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
      .remote-selection-${data.userId} {
        background-color: ${data.user.color}33 !important;
        border-radius: 2px;
      }
    `;

    // 2. Selection highlights via deltaDecorations
    const existing = remoteCursorsRef.current.get(data.userId);
    let newDecoIds: string[] = existing?.decorationIds || [];

    if (
      data.selection &&
      (data.selection.startLineNumber !== data.selection.endLineNumber ||
        data.selection.startColumn !== data.selection.endColumn)
    ) {
      const selectionRange = new monaco.Range(
        data.selection.startLineNumber,
        data.selection.startColumn,
        data.selection.endLineNumber,
        data.selection.endColumn
      );
      newDecoIds = editor.deltaDecorations(newDecoIds, [
        {
          range: selectionRange,
          options: {
            className: `remote-selection-${data.userId}`,
            hoverMessage: { value: `${data.user.name}'s selection` },
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          },
        },
      ]);
    } else {
      if (newDecoIds.length > 0) {
        newDecoIds = editor.deltaDecorations(newDecoIds, []);
      }
    }

    // 3. ContentWidget for cursor line & floating username flag
    if (existing) {
      existing.currentPos.lineNumber = data.position.lineNumber;
      existing.currentPos.column = data.position.column;
      existing.decorationIds = newDecoIds;
      existing.flagNode.textContent = data.user.name;
      editor.layoutContentWidget(existing.widget);
    } else {
      const domNode = document.createElement('div');
      domNode.className = 'monaco-remote-cursor-widget pointer-events-none select-none';
      domNode.style.position = 'absolute';
      domNode.style.zIndex = '40';

      // Vertical cursor line
      const bar = document.createElement('div');
      bar.className = 'monaco-remote-cursor-bar';
      bar.style.width = '2px';
      bar.style.height = '18px';
      bar.style.backgroundColor = data.user.color;
      bar.style.boxShadow = `0 0 6px ${data.user.color}cc`;
      bar.style.position = 'absolute';
      bar.style.left = '0';
      bar.style.top = '0';

      // Floating name flag
      const flagNode = document.createElement('div');
      flagNode.className = 'monaco-remote-flag';
      flagNode.textContent = data.user.name;
      flagNode.style.position = 'absolute';
      flagNode.style.left = '2px';
      flagNode.style.top = '-17px';
      flagNode.style.backgroundColor = data.user.color;
      flagNode.style.color = '#050507';
      flagNode.style.fontSize = '10px';
      flagNode.style.fontWeight = '700';
      flagNode.style.fontFamily = 'monospace';
      flagNode.style.padding = '1px 5px';
      flagNode.style.borderRadius = '3px 3px 3px 0';
      flagNode.style.whiteSpace = 'nowrap';
      flagNode.style.boxShadow = '0 2px 5px rgba(0,0,0,0.6)';
      flagNode.style.pointerEvents = 'none';

      domNode.appendChild(bar);
      domNode.appendChild(flagNode);

      const currentPos = {
        lineNumber: data.position.lineNumber,
        column: data.position.column,
      };

      const widget = {
        getId: () => `remote-cursor-${data.userId}`,
        getDomNode: () => domNode,
        getPosition: () => ({
          position: currentPos,
          preference: [monaco.editor.ContentWidgetPositionPreference.EXACT],
        }),
      };

      editor.addContentWidget(widget);

      remoteCursorsRef.current.set(data.userId, {
        widget,
        decorationIds: newDecoIds,
        currentPos,
        domNode,
        flagNode,
      });
    }
  }, [socket]);

  // Update language and load starter boilerplate template
  const applyLanguageChange = useCallback((newLang: string, updateBoilerplate = true) => {
    setLanguage(newLang);

    if (updateBoilerplate) {
      const boilerplate = LANGUAGE_BOILERPLATES[newLang] || `// Welcome to DevCollab Workspace (${newLang})\n`;
      setCode(boilerplate);

      if (editorRef.current) {
        editorRef.current.setValue(boilerplate);
      }

      if (socket) {
        socket.emit('code-change', {
          roomId,
          code: boilerplate,
        });
        socket.emit('code:change', {
          roomId,
          code: boilerplate,
        });
      }
    }

    if (socket) {
      socket.emit('code-language-change', {
        roomId,
        language: newLang,
      });
      socket.emit('code:language-change', {
        roomId,
        language: newLang,
      });
    }

    if (onLanguageChange) onLanguageChange(newLang);
  }, [roomId, socket, onLanguageChange]);

  // Code Execution Handler
  const handleRunCode = useCallback(async () => {
    if (isRunning) return;
    setIsTerminalOpen(true);
    setIsRunning(true);

    try {
      const res = await executeScript(code, language);
      setExecutionResult(res);
    } catch (err: any) {
      setExecutionResult({
        stdout: '',
        stderr: err.message || 'Execution error',
        exitCode: 1,
        executionTime: 0,
        memory: 'N/A',
      });
    } finally {
      setIsRunning(false);
    }
  }, [code, language, isRunning]);

  // Keep ref in sync so keyboard shortcut always calls latest version
  handleRunCodeRef.current = handleRunCode;

  // Expose methods to parent / Command Palette
  useImperativeHandle(ref, () => ({
    formatDocument: () => {
      if (editorRef.current) {
        editorRef.current.getAction('editor.action.formatDocument')?.run();
      }
    },
    setLanguage: (newLang: string) => {
      applyLanguageChange(newLang, true);
    },
    runCode: handleRunCode,
    getCode: () => code,
  }));

  // Sync initial state when provided
  useEffect(() => {
    if (initialCode && !editorReady) {
      setCode(initialCode);
    }
  }, [initialCode, editorReady]);

  useEffect(() => {
    if (initialLanguage) {
      setLanguage(initialLanguage);
    }
  }, [initialLanguage]);

  // Update theme dynamically when changed
  useEffect(() => {
    if (monacoRef.current && editorReady) {
      monacoRef.current.editor.setTheme(theme);
    }
  }, [theme, editorReady]);

  // Listen to remote code changes from socket
  useEffect(() => {
    if (!socket) return;

    const handleCodeUpdated = ({ code: newCode, senderId }: { code: string; senderId: string }) => {
      if (senderId === socket.id) return;

      // Preserve cursor position during remote update
      if (editorRef.current) {
        const currentPos = editorRef.current.getPosition();
        isLocalChange.current = false;
        setCode(newCode);

        // Restore cursor position on next tick
        setTimeout(() => {
          if (editorRef.current && currentPos) {
            editorRef.current.setPosition(currentPos);
          }
        }, 10);
      } else {
        setCode(newCode);
      }
    };

    const handleLanguageUpdated = ({ language: newLang }: { language: string }) => {
      setLanguage(newLang);
      if (onLanguageChange) onLanguageChange(newLang);
    };

    const handleRemoteCursor = (data: RemoteCursorPayload) => {
      updateRemoteCursor(data);
    };

    const handleRemoveCursor = ({ userId }: { userId: string }) => {
      removeRemoteCursor(userId);
    };

    socket.on('code-change', handleCodeUpdated);
    socket.on('code:updated', handleCodeUpdated);
    socket.on('code:language-updated', handleLanguageUpdated);
    socket.on('code-language-change', handleLanguageUpdated);
    socket.on('cursor-update', handleRemoteCursor);
    socket.on('cursor:update', handleRemoteCursor);
    socket.on('cursor:updated', handleRemoteCursor);
    socket.on('cursor-remove', handleRemoveCursor);
    socket.on('cursor:remove', handleRemoveCursor);
    socket.on('user-left', handleRemoveCursor);
    socket.on('user:left', handleRemoveCursor);

    return () => {
      socket.off('code-change', handleCodeUpdated);
      socket.off('code:updated', handleCodeUpdated);
      socket.off('code:language-updated', handleLanguageUpdated);
      socket.off('code-language-change', handleLanguageUpdated);
      socket.off('cursor-update', handleRemoteCursor);
      socket.off('cursor:update', handleRemoteCursor);
      socket.off('cursor:updated', handleRemoteCursor);
      socket.off('cursor-remove', handleRemoveCursor);
      socket.off('cursor:remove', handleRemoveCursor);
      socket.off('user-left', handleRemoveCursor);
      socket.off('user:left', handleRemoveCursor);
    };
  }, [socket, onLanguageChange, updateRemoteCursor, removeRemoteCursor]);

  // Clean up all remote cursors on unmount
  useEffect(() => {
    return () => {
      const editor = editorRef.current;
      remoteCursorsRef.current.forEach((val, userId) => {
        if (editor) {
          try {
            editor.removeContentWidget(val.widget);
            editor.deltaDecorations(val.decorationIds, []);
          } catch {}
        }
        document.getElementById(`monaco-remote-cursor-style-${userId}`)?.remove();
      });
      remoteCursorsRef.current.clear();
    };
  }, []);

  // Handle local code changes
  const handleEditorChange = (value: string | undefined) => {
    const updatedCode = value || '';
    setCode(updatedCode);

    if (socket) {
      isLocalChange.current = true;
      socket.emit('code-change', {
        roomId,
        code: updatedCode,
      });
      socket.emit('code:change', {
        roomId,
        code: updatedCode,
      });
    }
  };

  // Language Change from dropdown
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    applyLanguageChange(newLang, true);
  };

  // Copy Code to Clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format Code
  const handleFormatCode = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  // Monaco Editor mount
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setEditorReady(true);

    // Define custom Obsidian Dark Theme
    monaco.editor.defineTheme('obsidian-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '5c6370', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'c678dd', fontStyle: 'bold' },
        { token: 'string', foreground: '98c379' },
        { token: 'number', foreground: 'd19a66' },
        { token: 'type', foreground: 'e5c07b' },
        { token: 'function', foreground: '61afef' },
        { token: 'variable', foreground: 'e06c75' },
      ],
      colors: {
        'editor.background': '#0a0a0c',
        'editor.foreground': '#d4d4d8',
        'editorCursor.foreground': '#06b6d4',
        'editor.lineHighlightBackground': '#141419',
        'editorLineNumber.foreground': '#3f3f46',
        'editorLineNumber.activeForeground': '#06b6d4',
        'editor.selectionBackground': '#06b6d425',
        'editor.inactiveSelectionBackground': '#06b6d415',
        'editorIndentGuide.background': '#1a1a22',
        'editorIndentGuide.activeBackground': '#2e2e3a',
      },
    });

    monaco.editor.setTheme(theme);

    // Track cursor position movements and selections
    editor.onDidChangeCursorSelection((e) => {
      const sel = e.selection;
      setCursorPos({
        line: sel.positionLineNumber,
        col: sel.positionColumn,
      });

      if (socket) {
        const isRange = !sel.isEmpty();
        const payload = {
          roomId,
          position: {
            lineNumber: sel.positionLineNumber,
            column: sel.positionColumn,
          },
          selection: isRange
            ? {
                startLineNumber: sel.startLineNumber,
                startColumn: sel.startColumn,
                endLineNumber: sel.endLineNumber,
                endColumn: sel.endColumn,
              }
            : null,
        };
        socket.emit('cursor-move', payload);
        socket.emit('cursor:move', payload);
        socket.emit('cursor:change', payload);
      }
    });

    // Ctrl+Enter / Cmd+Enter to run code
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      () => { handleRunCodeRef.current(); }
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-obsidian border-r border-obsidian-border overflow-hidden">
      {/* Editor Header Bar */}
      <div className="h-10 px-3 border-b border-obsidian-border bg-obsidian/95 flex items-center justify-between text-xs select-none">
        {/* Language Selector */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-2 py-1 rounded bg-white/5 border border-white/10 text-zinc-300">
            <Code className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={language}
              onChange={handleLanguageChange}
              aria-label="Select Programming Language"
              className="bg-transparent text-xs text-zinc-200 outline-none cursor-pointer pr-1"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id} className="bg-obsidian-card text-zinc-200">
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Editor Actions */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleFormatCode}
            className="flex items-center space-x-1 px-2 py-1 rounded glass-button text-zinc-400 hover:text-white"
            title="Format Code"
          >
            <AlignLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Format</span>
          </button>

          {/* Run Button */}
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium transition-all ${
              isRunning
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 cursor-not-allowed'
                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 hover:bg-emerald-500/25 shadow-sm'
            }`}
            title="Run Code (Ctrl+Enter)"
          >
            {isRunning ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span className="hidden sm:inline">Running...</span></>
            ) : (
              <><Play className="w-3.5 h-3.5" /><span className="hidden sm:inline">Run</span></>
            )}
          </button>

          <button
            onClick={handleCopyCode}
            className="flex items-center space-x-1 px-2 py-1 rounded glass-button text-zinc-400 hover:text-white"
            title="Copy Code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div className="flex-1 min-h-0 w-full relative overflow-hidden">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme={theme}
          options={{
            fontSize: 13,
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontLigatures: true,
            tabSize: 2,
            minimap: { enabled: true, maxColumn: 80, scale: 0.8 },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>

      {/* Terminal Output Panel */}
      {isTerminalOpen && (
        <Terminal
          isOpen={isTerminalOpen}
          onToggle={() => setIsTerminalOpen(false)}
          onClose={() => { setIsTerminalOpen(false); setExecutionResult(null); }}
          result={executionResult}
          isRunning={isRunning}
          language={language}
          onClear={() => setExecutionResult(null)}
        />
      )}

      {/* Editor Status Bar */}
      <div className="h-6 px-3 border-t border-obsidian-border bg-obsidian/95 flex items-center justify-between text-[11px] text-zinc-500 font-mono select-none">
        <div className="flex items-center space-x-3">
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          <span>Spaces: 2</span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-cyan-400">{language.toUpperCase()}</span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400 text-[10px]">{theme}</span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </div>
      </div>
    </div>
  );
});

CodeEditor.displayName = 'CodeEditor';
