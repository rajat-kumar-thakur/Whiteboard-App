import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Point, DrawingElement, User } from '../types/drawing';
import { useThemeStore } from '../store/themeStore';

interface DrawingCanvasProps {
  elements: DrawingElement[];
  users: User[];
  selectedTool: string;
  selectedColor: string;
  onElementAdded: (element: DrawingElement) => void;
  onCursorMove: (position: Point) => void;
  onElementRemoved: (elementId: string) => void;
  userId: string;
  viewport: { x: number; y: number; zoom: number };
  onViewportChange: (viewport: { x: number; y: number; zoom: number }) => void;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  elements,
  users,
  selectedTool,
  selectedColor,
  onElementAdded,
  onCursorMove,
  onElementRemoved,
  userId,
  viewport,
  onViewportChange
}) => {
  const { isDarkMode } = useThemeStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState<Point>({ x: 0, y: 0 });
  const [textInput, setTextInput] = useState<string>('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPosition, setTextPosition] = useState<Point>({ x: 0, y: 0 });
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [erasedElements, setErasedElements] = useState<Set<string>>(new Set());

  const drawElement = useCallback((ctx: CanvasRenderingContext2D, element: DrawingElement) => {
    // Skip drawing if element was erased
    if (erasedElements.has(element.id)) return;

    ctx.save();
    ctx.strokeStyle = element.style.stroke;
    ctx.lineWidth = element.style.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Highlight selected element
    if (selectedElement === element.id) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = element.style.strokeWidth + 2;
    }

    switch (element.type) {
      case 'pen':
        if (element.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(element.points[0].x, element.points[0].y);
          for (let i = 1; i < element.points.length; i++) {
            ctx.lineTo(element.points[i].x, element.points[i].y);
          }
          ctx.stroke();
        }
        break;

      case 'rectangle':
        if (element.points.length >= 2) {
          const [start, end] = element.points;
          const width = end.x - start.x;
          const height = end.y - start.y;
          ctx.strokeRect(start.x, start.y, width, height);
          if (element.style.fill) {
            ctx.fillStyle = element.style.fill;
            ctx.fillRect(start.x, start.y, width, height);
          }
        }
        break;

      case 'circle':
        if (element.points.length >= 2) {
          const [start, end] = element.points;
          const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
          ctx.beginPath();
          ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
          if (element.style.fill) {
            ctx.fillStyle = element.style.fill;
            ctx.fill();
          }
        }
        break;

      case 'arrow':
        if (element.points.length >= 2) {
          const [start, end] = element.points;
          const angle = Math.atan2(end.y - start.y, end.x - start.x);
          const arrowLength = 20;
          const arrowAngle = Math.PI / 6;

          // Draw line
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();

          // Draw arrowhead
          ctx.beginPath();
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(
            end.x - arrowLength * Math.cos(angle - arrowAngle),
            end.y - arrowLength * Math.sin(angle - arrowAngle)
          );
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(
            end.x - arrowLength * Math.cos(angle + arrowAngle),
            end.y - arrowLength * Math.sin(angle + arrowAngle)
          );
          ctx.stroke();
        }
        break;

      case 'text':
        if (element.text && element.points.length > 0) {
          ctx.fillStyle = element.style.stroke;
          ctx.font = '16px Arial';
          ctx.fillText(element.text, element.points[0].x, element.points[0].y);
        }
        break;
    }
    ctx.restore();
  }, [selectedElement, erasedElements]);

  const checkEraserIntersection = useCallback((eraserPath: Point[], element: DrawingElement): boolean => {
    const eraserRadius = 10; // Eraser hit radius
    
    for (const eraserPoint of eraserPath) {
      switch (element.type) {
        case 'pen':
          // Check if eraser point is near any line segment
          for (let i = 0; i < element.points.length - 1; i++) {
            const p1 = element.points[i];
            const p2 = element.points[i + 1];
            if (distanceToLineSegment(eraserPoint, p1, p2) < eraserRadius) {
              return true;
            }
          }
          break;

        case 'rectangle':
          if (element.points.length >= 2) {
            const [start, end] = element.points;
            const minX = Math.min(start.x, end.x);
            const maxX = Math.max(start.x, end.x);
            const minY = Math.min(start.y, end.y);
            const maxY = Math.max(start.y, end.y);
            
            // Check if eraser point is inside or near the rectangle
            if (eraserPoint.x >= minX - eraserRadius && eraserPoint.x <= maxX + eraserRadius &&
                eraserPoint.y >= minY - eraserRadius && eraserPoint.y <= maxY + eraserRadius) {
              return true;
            }
          }
          break;

        case 'circle':
          if (element.points.length >= 2) {
            const [start, end] = element.points;
            const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
            const distance = Math.sqrt(Math.pow(eraserPoint.x - start.x, 2) + Math.pow(eraserPoint.y - start.y, 2));
            if (distance <= radius + eraserRadius) {
              return true;
            }
          }
          break;

        case 'arrow':
          if (element.points.length >= 2) {
            const [start, end] = element.points;
            if (distanceToLineSegment(eraserPoint, start, end) < eraserRadius) {
              return true;
            }
          }
          break;

        case 'text':
          if (element.points.length > 0) {
            const textPos = element.points[0];
            const textWidth = (element.text?.length || 0) * 10;
            const textHeight = 16;
            
            if (eraserPoint.x >= textPos.x - eraserRadius && eraserPoint.x <= textPos.x + textWidth + eraserRadius &&
                eraserPoint.y >= textPos.y - textHeight - eraserRadius && eraserPoint.y <= textPos.y + eraserRadius) {
              return true;
            }
          }
          break;
      }
    }
    return false;
  }, []);

  const drawCursors = useCallback((ctx: CanvasRenderingContext2D) => {
    users.forEach(user => {
      if (user.cursor && user.id !== userId) {
        ctx.save();
        ctx.fillStyle = user.color;
        ctx.beginPath();
        ctx.arc(user.cursor.x, user.cursor.y, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw user name
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText(user.name, user.cursor.x + 12, user.cursor.y - 8);
        ctx.restore();
      }
    });
  }, [users, userId]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply viewport transformation
    ctx.save();
    ctx.scale(viewport.zoom, viewport.zoom);
    ctx.translate(viewport.x, viewport.y);

    // Draw all elements
    elements.forEach(element => drawElement(ctx, element));

    // Draw current path if drawing
    if (isDrawing && currentPath.length > 1) {
      ctx.save();
      if (selectedTool === 'eraser') {
        // Draw eraser preview
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 20;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(currentPath[0].x, currentPath[0].y);
        for (let i = 1; i < currentPath.length; i++) {
          ctx.lineTo(currentPath[i].x, currentPath[i].y);
        }
        ctx.stroke();
      } else if (selectedTool === 'rectangle' && currentPath.length === 2) {
        // Draw rectangle preview
        ctx.strokeStyle = selectedColor;
        ctx.lineWidth = 2;
        const [start, end] = currentPath;
        const width = end.x - start.x;
        const height = end.y - start.y;
        ctx.strokeRect(start.x, start.y, width, height);
      } else if (selectedTool === 'circle' && currentPath.length === 2) {
        // Draw circle preview
        ctx.strokeStyle = selectedColor;
        ctx.lineWidth = 2;
        const [start, end] = currentPath;
        const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
        ctx.beginPath();
        ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (selectedTool === 'arrow' && currentPath.length === 2) {
        // Draw arrow preview
        ctx.strokeStyle = selectedColor;
        ctx.lineWidth = 2;
        const [start, end] = currentPath;
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const arrowLength = 20;
        const arrowAngle = Math.PI / 6;
        // Draw line
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        // Draw arrowhead
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
          end.x - arrowLength * Math.cos(angle - arrowAngle),
          end.y - arrowLength * Math.sin(angle - arrowAngle)
        );
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
          end.x - arrowLength * Math.cos(angle + arrowAngle),
          end.y - arrowLength * Math.sin(angle + arrowAngle)
        );
        ctx.stroke();
      } else {
        // Default: draw polyline (for pen, fallback)
        ctx.strokeStyle = selectedColor;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(currentPath[0].x, currentPath[0].y);
        for (let i = 1; i < currentPath.length; i++) {
          ctx.lineTo(currentPath[i].x, currentPath[i].y);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();

    // Draw cursors (not affected by viewport)
    drawCursors(ctx);
  }, [elements, isDrawing, currentPath, viewport, drawElement, drawCursors, selectedColor, selectedTool]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      redraw();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [redraw]);

  // Update canvas background based on theme
  const canvasBackground = isDarkMode ? '#1a1a1a' : '#f8fafc';

  const getMousePos = (e: React.MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - viewport.x * viewport.zoom) / viewport.zoom,
      y: (e.clientY - rect.top - viewport.y * viewport.zoom) / viewport.zoom
    };
  };

  const findElementAtPoint = (point: Point): DrawingElement | null => {
    // Check elements in reverse order (top to bottom)
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      if (isPointInElement(point, element)) {
        return element;
      }
    }
    return null;
  };

  const isPointInElement = (point: Point, element: DrawingElement): boolean => {
    switch (element.type) {
      case 'pen':
        // Check if point is near any line segment
        for (let i = 0; i < element.points.length - 1; i++) {
          const p1 = element.points[i];
          const p2 = element.points[i + 1];
          if (distanceToLineSegment(point, p1, p2) < 10) {
            return true;
          }
        }
        return false;

      case 'rectangle':
        if (element.points.length >= 2) {
          const [start, end] = element.points;
          const minX = Math.min(start.x, end.x);
          const maxX = Math.max(start.x, end.x);
          const minY = Math.min(start.y, end.y);
          const maxY = Math.max(start.y, end.y);
          return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
        }
        return false;

      case 'circle':
        if (element.points.length >= 2) {
          const [start, end] = element.points;
          const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
          const distance = Math.sqrt(Math.pow(point.x - start.x, 2) + Math.pow(point.y - start.y, 2));
          return distance <= radius;
        }
        return false;

      case 'arrow':
        if (element.points.length >= 2) {
          const [start, end] = element.points;
          return distanceToLineSegment(point, start, end) < 10;
        }
        return false;

      case 'text':
        if (element.points.length > 0) {
          const textPos = element.points[0];
          // Approximate text bounds
          const textWidth = (element.text?.length || 0) * 10;
          const textHeight = 16;
          return point.x >= textPos.x && point.x <= textPos.x + textWidth &&
                 point.y >= textPos.y - textHeight && point.y <= textPos.y;
        }
        return false;

      default:
        return false;
    }
  };

  const distanceToLineSegment = (point: Point, p1: Point, p2: Point): number => {
    const A = point.x - p1.x;
    const B = point.y - p1.y;
    const C = p2.x - p1.x;
    const D = p2.y - p1.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = p1.x;
      yy = p1.y;
    } else if (param > 1) {
      xx = p2.x;
      yy = p2.y;
    } else {
      xx = p1.x + param * C;
      yy = p1.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getMousePos(e);

    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      // Middle mouse or Ctrl+click for panning
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    if (selectedTool === 'select') {
      const element = findElementAtPoint(pos);
      setSelectedElement(element?.id || null);
      return;
    }

    if (selectedTool === 'text') {
      setTextPosition(pos);
      setShowTextInput(true);
      return;
    }

    if (selectedTool === 'pen' || selectedTool === 'eraser') {
      setIsDrawing(true);
      setCurrentPath([pos]);
    } else if (['rectangle', 'circle', 'arrow'].includes(selectedTool)) {
      setIsDrawing(true);
      setCurrentPath([pos]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    onCursorMove(pos);

    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      onViewportChange({
        ...viewport,
        x: viewport.x + deltaX / viewport.zoom,
        y: viewport.y + deltaY / viewport.zoom
      });
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    if (isDrawing) {
      if (selectedTool === 'pen') {
        setCurrentPath(prev => [...prev, pos]);
      } else if (selectedTool === 'eraser') {
        const newPath = [...currentPath, pos];
        setCurrentPath(newPath);
        
        // Check for eraser intersections
        const newErasedElements = new Set(erasedElements);
        let hasChanges = false;

        elements.forEach(element => {
          if (!erasedElements.has(element.id) && checkEraserIntersection(newPath, element)) {
            newErasedElements.add(element.id);
            onElementRemoved(element.id);
            hasChanges = true;
          }
        });

        if (hasChanges) {
          setErasedElements(newErasedElements);
        }
      } else if (['rectangle', 'circle', 'arrow'].includes(selectedTool)) {
        setCurrentPath(prev => [prev[0], pos]);
      }
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDrawing && currentPath.length > 0) {
      if (selectedTool === 'pen') {
        const element: DrawingElement = {
          id: `${userId}-${Date.now()}`,
          type: 'pen',
          points: [...currentPath],
          style: {
            stroke: selectedColor,
            strokeWidth: 2
          },
          userId,
          timestamp: Date.now()
        };
        onElementAdded(element);
      } else if (selectedTool === 'rectangle' && currentPath.length === 2) {
        const element: DrawingElement = {
          id: `${userId}-${Date.now()}`,
          type: 'rectangle',
          points: [...currentPath],
          style: {
            stroke: selectedColor,
            strokeWidth: 2
          },
          userId,
          timestamp: Date.now()
        };
        onElementAdded(element);
      } else if (selectedTool === 'circle' && currentPath.length === 2) {
        const element: DrawingElement = {
          id: `${userId}-${Date.now()}`,
          type: 'circle',
          points: [...currentPath],
          style: {
            stroke: selectedColor,
            strokeWidth: 2
          },
          userId,
          timestamp: Date.now()
        };
        onElementAdded(element);
      } else if (selectedTool === 'arrow' && currentPath.length === 2) {
        const element: DrawingElement = {
          id: `${userId}-${Date.now()}`,
          type: 'arrow',
          points: [...currentPath],
          style: {
            stroke: selectedColor,
            strokeWidth: 2
          },
          userId,
          timestamp: Date.now()
        };
        onElementAdded(element);
      }
      // For eraser, we don't create elements, we just remove them
      setCurrentPath([]);
      setIsDrawing(false);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, viewport.zoom * zoomFactor));
    onViewportChange({ ...viewport, zoom: newZoom });
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      const element: DrawingElement = {
        id: `${userId}-${Date.now()}`,
        type: 'text',
        points: [textPosition],
        style: {
          stroke: selectedColor,
          strokeWidth: 2
        },
        text: textInput.trim(),
        userId,
        timestamp: Date.now()
      };

      onElementAdded(element);
      setTextInput('');
      setShowTextInput(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTextSubmit();
    } else if (e.key === 'Escape') {
      setTextInput('');
      setShowTextInput(false);
    }
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 ${
          selectedTool === 'select' ? 'cursor-pointer' : 
          selectedTool === 'eraser' ? 'cursor-crosshair' : 'cursor-crosshair'
        }`}
        style={{ background: canvasBackground }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />
      
      {/* Text Input Overlay */}
      {showTextInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`border p-6 rounded-xl shadow-2xl ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-600' 
              : 'bg-white border-gray-200'
          }`}>
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleTextSubmit}
              autoFocus
              className={`px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDarkMode
                  ? 'bg-gray-700 text-white border-gray-600'
                  : 'bg-white text-gray-900 border-gray-300'
              }`}
              placeholder="Enter text..."
            />
            <div className={`text-xs mt-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Press Enter to confirm, Escape to cancel
            </div>
          </div>
        </div>
      )}
    </>
  );
};