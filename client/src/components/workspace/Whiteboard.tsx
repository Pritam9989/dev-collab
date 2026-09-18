import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { fabric } from 'fabric';
import { Socket } from 'socket.io-client';
import {
  MousePointer,
  Pencil,
  Square,
  Circle as CircleIcon,
  Minus,
  Type,
  Trash2,
  Download,
  RotateCcw,
} from 'lucide-react';
import { DrawingTool } from '../../types/index.js';

export interface WhiteboardHandle {
  clearCanvas: () => void;
  exportImage: () => void;
}

interface WhiteboardProps {
  roomId: string;
  socket: Socket | null;
  initialCanvasData: string | null;
}

const PALETTE = [
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#10b981', // Emerald
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#ffffff', // White
  '#71717a', // Zinc
];

const STROKE_WIDTHS = [2, 4, 8, 12];

export const Whiteboard = forwardRef<WhiteboardHandle, WhiteboardProps>(({
  roomId,
  socket,
  initialCanvasData,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvas = useRef<fabric.Canvas | null>(null);

  const [activeTool, setActiveTool] = useState<DrawingTool>('pencil');
  const [selectedColor, setSelectedColor] = useState<string>('#06b6d4');
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const isRemoteUpdate = useRef<boolean>(false);

  // Initialize Fabric.js Canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: container.clientWidth,
      height: container.clientHeight,
      backgroundColor: '#0e0e12',
      isDrawingMode: true,
      selection: true,
    });

    // Default brush settings
    canvas.freeDrawingBrush.color = selectedColor;
    canvas.freeDrawingBrush.width = strokeWidth;

    fabricCanvas.current = canvas;

    // Load initial canvas state if present
    if (initialCanvasData) {
      try {
        canvas.loadFromJSON(initialCanvasData, () => {
          canvas.renderAll();
        });
      } catch (err) {
        console.error('Failed to load initial whiteboard data:', err);
      }
    }

    // Auto-resize canvas with ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0 && fabricCanvas.current) {
          fabricCanvas.current.setWidth(width);
          fabricCanvas.current.setHeight(height);
          fabricCanvas.current.renderAll();
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      canvas.dispose();
      fabricCanvas.current = null;
    };
  }, []);

  // Broadcast canvas changes
  const broadcastCanvasState = useCallback(() => {
    if (isRemoteUpdate.current || !fabricCanvas.current || !socket) return;
    const json = JSON.stringify(fabricCanvas.current.toJSON());
    socket.emit('drawing-data', {
      roomId,
      data: json,
    });
    socket.emit('canvas:update', {
      roomId,
      data: json,
    });
  }, [roomId, socket]);

  // Canvas Event Listeners
  useEffect(() => {
    const canvas = fabricCanvas.current;
    if (!canvas) return;

    const handleObjectModified = () => broadcastCanvasState();
    const handlePathCreated = () => broadcastCanvasState();

    canvas.on('object:modified', handleObjectModified);
    canvas.on('path:created', handlePathCreated);

    return () => {
      canvas.off('object:modified', handleObjectModified);
      canvas.off('path:created', handlePathCreated);
    };
  }, [broadcastCanvasState]);

  // Socket listeners for remote updates
  useEffect(() => {
    if (!socket) return;

    const handleCanvasUpdated = ({ data, senderId }: { data: string; senderId: string }) => {
      if (senderId === socket.id || !fabricCanvas.current) return;
      isRemoteUpdate.current = true;
      fabricCanvas.current.loadFromJSON(data, () => {
        fabricCanvas.current?.renderAll();
        isRemoteUpdate.current = false;
      });
    };

    const handleCanvasCleared = ({ senderId }: { senderId: string }) => {
      if (senderId === socket.id || !fabricCanvas.current) return;
      isRemoteUpdate.current = true;
      fabricCanvas.current.clear();
      fabricCanvas.current.setBackgroundColor('#0e0e12', () => {
        fabricCanvas.current?.renderAll();
        isRemoteUpdate.current = false;
      });
    };

    socket.on('drawing-data', handleCanvasUpdated);
    socket.on('canvas:updated', handleCanvasUpdated);
    socket.on('clear-canvas', handleCanvasCleared);
    socket.on('canvas:cleared', handleCanvasCleared);

    return () => {
      socket.off('drawing-data', handleCanvasUpdated);
      socket.off('canvas:updated', handleCanvasUpdated);
      socket.off('clear-canvas', handleCanvasCleared);
      socket.off('canvas:cleared', handleCanvasCleared);
    };
  }, [socket]);

  // Update brush and mode when tool, color, or stroke changes
  useEffect(() => {
    const canvas = fabricCanvas.current;
    if (!canvas) return;

    if (activeTool === 'select') {
      canvas.isDrawingMode = false;
      canvas.selection = true;
    } else if (activeTool === 'pencil') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.color = selectedColor;
      canvas.freeDrawingBrush.width = strokeWidth;
    } else {
      canvas.isDrawingMode = false;
      canvas.selection = false;
    }
  }, [activeTool, selectedColor, strokeWidth]);

  // Add Geometric Shapes & Text
  const addShape = (type: 'rect' | 'circle' | 'line' | 'text') => {
    const canvas = fabricCanvas.current;
    if (!canvas) return;

    const centerX = canvas.getWidth() / 2 - 50;
    const centerY = canvas.getHeight() / 2 - 50;

    let shape: fabric.Object;

    if (type === 'rect') {
      shape = new fabric.Rect({
        left: centerX,
        top: centerY,
        fill: 'transparent',
        stroke: selectedColor,
        strokeWidth: strokeWidth,
        width: 120,
        height: 80,
        rx: 8,
        ry: 8,
      });
    } else if (type === 'circle') {
      shape = new fabric.Circle({
        left: centerX,
        top: centerY,
        fill: 'transparent',
        stroke: selectedColor,
        strokeWidth: strokeWidth,
        radius: 50,
      });
    } else if (type === 'line') {
      shape = new fabric.Line([centerX, centerY, centerX + 120, centerY + 80], {
        stroke: selectedColor,
        strokeWidth: strokeWidth,
      });
    } else {
      shape = new fabric.IText('DevCollab Note', {
        left: centerX,
        top: centerY,
        fill: selectedColor,
        fontSize: 20,
        fontFamily: 'Inter, sans-serif',
      });
    }

    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
    broadcastCanvasState();
    setActiveTool('select');
  };

  // Delete Active Object
  const deleteSelected = () => {
    const canvas = fabricCanvas.current;
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length) {
      activeObjects.forEach((obj) => canvas.remove(obj));
      canvas.discardActiveObject();
      canvas.renderAll();
      broadcastCanvasState();
    }
  };

  // Clear Whiteboard
  const clearCanvas = () => {
    const canvas = fabricCanvas.current;
    if (!canvas) return;
    canvas.clear();
    canvas.setBackgroundColor('#0e0e12', () => {
      canvas.renderAll();
    });
    if (socket) {
      socket.emit('clear-canvas', { roomId });
      socket.emit('canvas:clear', { roomId });
    }
  };

  // Export Canvas as PNG
  const exportImage = () => {
    const canvas = fabricCanvas.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });
    const link = document.createElement('a');
    link.download = `devcollab-whiteboard-${roomId}.png`;
    link.href = dataURL;
    link.click();
  };

  // Expose imperative methods to parent / Command Palette
  useImperativeHandle(ref, () => ({
    clearCanvas,
    exportImage,
  }));

  return (
    <div className="w-full h-full flex flex-col bg-[#0e0e12] overflow-hidden relative select-none">
      {/* Top Floating Whiteboard Toolbar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2 px-3 py-1.5 rounded-xl glass-panel-elevated shadow-glass border border-white/10">
        {/* Selection / Pointer */}
        <button
          onClick={() => setActiveTool('select')}
          className={`p-1.5 rounded-lg transition-colors ${
            activeTool === 'select'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
          title="Select / Move Tool"
        >
          <MousePointer className="w-4 h-4" />
        </button>

        {/* Freehand Pencil */}
        <button
          onClick={() => setActiveTool('pencil')}
          className={`p-1.5 rounded-lg transition-colors ${
            activeTool === 'pencil'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
          title="Pencil / Freehand Draw"
        >
          <Pencil className="w-4 h-4" />
        </button>

        <div className="h-4 w-[1px] bg-obsidian-border" />

        {/* Shape Buttons */}
        <button
          onClick={() => addShape('rect')}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          title="Add Rectangle"
        >
          <Square className="w-4 h-4" />
        </button>

        <button
          onClick={() => addShape('circle')}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          title="Add Circle"
        >
          <CircleIcon className="w-4 h-4" />
        </button>

        <button
          onClick={() => addShape('line')}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          title="Add Line"
        >
          <Minus className="w-4 h-4" />
        </button>

        <button
          onClick={() => addShape('text')}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          title="Add Text"
        >
          <Type className="w-4 h-4" />
        </button>

        <div className="h-4 w-[1px] bg-obsidian-border" />

        {/* Color Palette Dots */}
        <div className="flex items-center space-x-1.5 px-1">
          {PALETTE.map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`w-4 h-4 rounded-full transition-transform ${
                selectedColor === color
                  ? 'scale-125 ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#0e0e12]'
                  : 'hover:scale-110 opacity-80'
              }`}
              style={{ backgroundColor: color }}
              title={`Color: ${color}`}
            />
          ))}
        </div>

        <div className="h-4 w-[1px] bg-obsidian-border" />

        {/* Stroke Width Selector */}
        <div className="flex items-center space-x-1">
          {STROKE_WIDTHS.map((width) => (
            <button
              key={width}
              onClick={() => setStrokeWidth(width)}
              className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${
                strokeWidth === width
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {width}px
            </button>
          ))}
        </div>

        <div className="h-4 w-[1px] bg-obsidian-border" />

        {/* Action Buttons: Delete, Clear, Export */}
        <button
          onClick={deleteSelected}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title="Delete Selected Item"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <button
          onClick={clearCanvas}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
          title="Clear Entire Canvas"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={exportImage}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
          title="Export Canvas to PNG"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas Mount Container */}
      <div ref={containerRef} className="w-full h-full relative cursor-crosshair">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
});

Whiteboard.displayName = 'Whiteboard';
