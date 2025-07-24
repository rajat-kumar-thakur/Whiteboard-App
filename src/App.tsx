import React, { useEffect, useState, useCallback } from 'react';
import { ThemeProvider } from './components/ThemeProvider';
import { DrawingCanvas } from './components/DrawingCanvas';
import { Toolbar } from './components/Toolbar';
import { UserList } from './components/UserList';
import { useWebSocket } from './hooks/useWebSocket';
import { useDrawingStore } from './store/drawingStore';
import { useThemeStore } from './store/themeStore';
import { WebSocketMessage, DrawingElement, Point, DrawingState } from './types/drawing';
import { exportCanvasAsImage, downloadImage } from './utils/export';

function App() {
  const { isDarkMode } = useThemeStore();
  const [userId] = useState(() => `user-${Math.random().toString(36).substr(2, 9)}`);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const {
    elements,
    users,
    selectedTool,
    selectedColor,
    viewport,
    addElement,
    removeElement,
    setUsers,
    updateUser,
    setSelectedTool,
    setSelectedColor,
    setViewport,
    resetViewport,
    canUndo,
    undo
  } = useDrawingStore();

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'initial_state': {
        // Handle initial state from server
        const stateData = message.data as DrawingState;
        if (stateData.elements) {
          stateData.elements.forEach((element: DrawingElement) => addElement(element));
        }
        if (stateData.users) {
          setUsers(stateData.users);
        }
        break;
      }

      case 'element_added':
        if (message.userId !== userId) {
          addElement(message.data as DrawingElement);
        }
        break;

      case 'element_deleted':
        if (message.userId !== userId) {
          removeElement(message.data as string);
        }
        break;

      case 'cursor_moved':
        if (message.userId !== userId) {
          const cursorData = message.data as { position: Point };
          updateUser(message.userId, { cursor: cursorData.position });
        }
        break;

      case 'user_joined':
        console.log('User joined:', message.data);
        break;

      case 'user_left':
        console.log('User left:', message.data);
        break;
    }
  }, [userId, addElement, removeElement, setUsers, updateUser]);

  const { isConnected, users: wsUsers, sendMessage } = useWebSocket(userId, handleWebSocketMessage);

  useEffect(() => {
    setUsers(wsUsers);
  }, [wsUsers, setUsers]);

  const handleElementAdded = (element: DrawingElement) => {
    addElement(element);
    sendMessage({
      type: 'element_added',
      data: element
    });
  };

  const handleElementRemoved = (elementId: string) => {
    removeElement(elementId);
    sendMessage({
      type: 'element_deleted',
      data: elementId
    });
  };

  const handleCursorMove = (position: Point) => {
    updateUser(userId, { cursor: position });
    sendMessage({
      type: 'cursor_moved',
      data: { position }
    });
  };

  const handleZoomIn = () => {
    setViewport(prev => ({ ...prev, zoom: Math.min(5, prev.zoom * 1.2) }));
  };

  const handleZoomOut = () => {
    setViewport(prev => ({ ...prev, zoom: Math.max(0.1, prev.zoom * 0.8) }));
  };

  const handleExport = () => {
    const dataUrl = exportCanvasAsImage(elements, 1920, 1080);
    downloadImage(dataUrl, `collaborative-drawing-${Date.now()}.png`);
  };

  const handleClearCanvas = () => {
    // Clear all elements from the store
    useDrawingStore.getState().clearCanvas();
  };

  const handleToggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <ThemeProvider>
      <div className={`w-full h-screen overflow-hidden relative transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        {/* Connection Status */}
        <div className="fixed bottom-4 left-4 z-20">
          <div className={`px-4 py-2 rounded-xl text-sm font-medium shadow-lg backdrop-blur-sm border transition-all duration-200 ${
            isConnected 
              ? isDarkMode
                ? 'bg-green-900/50 text-green-400 border-green-700' 
                : 'bg-green-50/90 text-green-700 border-green-200'
              : isDarkMode
                ? 'bg-red-900/50 text-red-400 border-red-700'
                : 'bg-red-50/90 text-red-700 border-red-200'
          }`}>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                isConnected 
                  ? 'bg-green-400 animate-pulse' 
                  : 'bg-red-400 animate-pulse'
              }`} />
              <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
            </div>
          </div>
        </div>

        {/* Main Canvas */}
        <DrawingCanvas
          elements={elements}
          users={users}
          selectedTool={selectedTool}
          selectedColor={selectedColor}
          onElementAdded={handleElementAdded}
          onCursorMove={handleCursorMove}
          onElementRemoved={handleElementRemoved}
          userId={userId}
          viewport={viewport}
          onViewportChange={setViewport}
        />

        {/* Toolbar */}
        <Toolbar
          selectedTool={selectedTool}
          onToolSelect={setSelectedTool}
          selectedColor={selectedColor}
          onColorSelect={setSelectedColor}
          userCount={users.length}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={resetViewport}
          onExport={handleExport}
          onClearCanvas={handleClearCanvas}
          onUndo={undo}
          canUndo={canUndo()}
          isMobileMenuOpen={isMobileMenuOpen}
          onToggleMobileMenu={handleToggleMobileMenu}
        />

        {/* User List */}
        <UserList users={users} currentUserId={userId} />

        {/* Instructions - Hidden on mobile */}
        <div className="fixed bottom-6 right-4 z-10 hidden lg:block max-w-sm">
          <div className={`backdrop-blur-sm border rounded-xl p-4 shadow-xl max-w-sm ${
            isDarkMode 
              ? 'bg-gray-900/95 border-gray-700' 
              : 'bg-white/95 border-gray-200'
          }`}>
            <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Quick Guide
            </h3>
            <div className={`text-xs space-y-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <p>• Click and drag to draw with selected tool</p>
              <p>• Mouse wheel to zoom in/out</p>
              <p>• Ctrl+click to pan around canvas</p>
              <p>• Use text tool to add labels</p>
              <p>• Select tool to highlight elements</p>
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;