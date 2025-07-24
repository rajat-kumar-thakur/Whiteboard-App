import React from 'react';
import { 
  Pen, 
  Square, 
  Circle, 
  ArrowRight, 
  Type, 
  MousePointer2,
  Users,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RefreshCcw,
  Download,
  Palette,
  Trash2,
  Eraser,
  Sun,
  Moon,
  Menu,
  X
} from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

interface ToolbarProps {
  selectedTool: string;
  onToolSelect: (tool: string) => void;
  selectedColor: string;
  onColorSelect: (color: string) => void;
  userCount: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onExport: () => void;
  onClearCanvas: () => void;
  onUndo: () => void;
  canUndo: boolean;
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

const tools = [
  { id: 'select', icon: MousePointer2, label: 'Select' },
  { id: 'pen', icon: Pen, label: 'Pen' },
  { id: 'eraser', icon: Eraser, label: 'Eraser' },
  { id: 'rectangle', icon: Square, label: 'Rectangle' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'arrow', icon: ArrowRight, label: 'Arrow' },
  { id: 'text', icon: Type, label: 'Text' },
];

const colors = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Green
  '#f59e0b', // Yellow
  '#8b5cf6', // Purple
  '#f97316', // Orange
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#ffffff', // White
  '#6b7280', // Gray
];

export const Toolbar: React.FC<ToolbarProps> = ({
  selectedTool,
  onToolSelect,
  selectedColor,
  onColorSelect,
  userCount,
  onZoomIn,
  onZoomOut,
  onReset,
  onExport,
  onClearCanvas,
  onUndo,
  canUndo,
  isMobileMenuOpen,
  onToggleMobileMenu
}) => {
  const { isDarkMode, toggleTheme } = useThemeStore();

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="fixed top-4 left-4 z-30 md:hidden">
        <button
          onClick={onToggleMobileMenu}
          className={`p-3 rounded-xl shadow-lg transition-all duration-200 ${
            isDarkMode 
              ? 'bg-gray-900/95 border border-gray-700 text-white hover:bg-gray-800' 
              : 'bg-white/95 border border-gray-200 text-gray-900 hover:bg-gray-50'
          } backdrop-blur-sm`}
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Desktop Toolbar */}
      <div className="hidden md:block fixed top-4 left-1/2 transform -translate-x-1/2 z-20 max-w-7xl w-full px-4">
        <div className={`backdrop-blur-sm rounded-xl shadow-2xl border ${
          isDarkMode 
            ? 'bg-gray-900/95 border-gray-700' 
            : 'bg-white/95 border-gray-200'
        }`}>
          <div className="mx-auto px-6">
            <div className="flex items-center justify-between h-14">
              {/* Left Section - Drawing Tools */}
              <div className="flex items-center space-x-2">
                {/* Drawing Tools */}
                <div className="flex items-center space-x-2">
                  {tools.map(tool => {
                    const Icon = tool.icon;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => onToolSelect(tool.id)}
                        className={`p-3 rounded-lg transition-all duration-200 ${
                          selectedTool === tool.id
                            ? 'bg-blue-600 text-white shadow-md'
                            : isDarkMode
                              ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                        title={tool.label}
                      >
                        <Icon size={20} />
                      </button>
                    );
                  })}
                </div>

                {/* Divider */}
                <div className={`w-px h-8 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>

                {/* Color Picker */}
                <div className="flex items-center space-x-3">
                  <Palette size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                  <div className="flex items-center space-x-2">
                    {colors.map(color => (
                      <button
                        key={color}
                        onClick={() => onColorSelect(color)}
                        className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 ${
                          selectedColor === color
                            ? 'border-blue-500 scale-110 shadow-md'
                            : isDarkMode
                              ? 'border-gray-600 hover:border-gray-400 hover:scale-105'
                              : 'border-gray-300 hover:border-gray-500 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                        title={`Color: ${color}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Section - Controls & Status */}
              <div className="flex items-center space-x-3">
                {/* View Controls */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={onZoomOut}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isDarkMode
                        ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    title="Zoom Out"
                  >
                    <ZoomOut size={20} />
                  </button>
                  <button
                    onClick={onZoomIn}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isDarkMode
                        ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    title="Zoom In"
                  >
                    <ZoomIn size={20} />
                  </button>
                  <button
                    onClick={onUndo}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      canUndo 
                        ? isDarkMode
                          ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        : isDarkMode
                          ? 'text-gray-600 cursor-not-allowed'
                          : 'text-gray-400 cursor-not-allowed'
                    }`}
                    title="Undo (Ctrl+Z)"
                    disabled={!canUndo}
                  >
                    <RotateCcw size={20} />
                  </button>
                  <button
                    onClick={onReset}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isDarkMode
                        ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    title="Reset View (Center & Zoom 1x)"
                  >
                    <RefreshCcw size={20} />
                  </button>
                </div>

                {/* Divider */}
                <div className={`w-px h-8 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    isDarkMode
                      ? 'text-yellow-400 hover:text-yellow-300 hover:bg-gray-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
                >
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                {/* Utility Controls */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={onExport}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isDarkMode
                        ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    title="Export Drawing"
                  >
                    <Download size={20} />
                  </button>
                  
                  <button
                    onClick={onClearCanvas}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isDarkMode
                        ? 'text-gray-300 hover:text-red-400 hover:bg-red-900/20'
                        : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                    }`}
                    title="Clear Canvas"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                {/* Divider */}
                <div className={`w-px h-8 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                
                {/* User Count */}
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-600'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <Users size={18} className="text-green-500" />
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {userCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Toolbar */}
      <div className={`md:hidden fixed inset-0 z-20 transition-all duration-300 ${
        isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
      }`}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onToggleMobileMenu}
        />
        
        {/* Mobile Menu */}
        <div className={`absolute top-4 left-4 right-4 rounded-xl shadow-2xl border max-h-[calc(100vh-2rem)] overflow-y-auto ${
          isDarkMode 
            ? 'bg-gray-900/95 border-gray-700' 
            : 'bg-white/95 border-gray-200'
        } backdrop-blur-sm`}>
          <div className="p-4 space-y-6">
            {/* Drawing Tools */}
            <div>
              <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Drawing Tools
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {tools.map(tool => {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => onToolSelect(tool.id)}
                      className={`p-2.5 rounded-lg transition-all duration-200 ${
                        selectedTool === tool.id
                          ? 'bg-blue-600 text-white shadow-md'
                          : isDarkMode
                            ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                      title={tool.label}
                    >
                      <Icon size={20} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Picker */}
            <div>
              <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Colors
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => onColorSelect(color)}
                    className={`w-10 h-10 rounded-lg border-2 transition-all duration-200 ${
                      selectedColor === color
                        ? 'border-blue-500 scale-110 shadow-md'
                        : isDarkMode
                          ? 'border-gray-600 hover:border-gray-400 hover:scale-105'
                          : 'border-gray-300 hover:border-gray-500 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    title={`Color: ${color}`}
                  />
                ))}
              </div>
            </div>

            {/* Controls */}
            <div>
              <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Controls
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onZoomOut}
                  className={`p-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
                    isDarkMode
                      ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title="Zoom Out"
                >
                  <ZoomOut size={20} />
                  <span className="text-sm">Zoom Out</span>
                </button>
                <button
                  onClick={onZoomIn}
                  className={`p-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
                    isDarkMode
                      ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title="Zoom In"
                >
                  <ZoomIn size={20} />
                  <span className="text-sm">Zoom In</span>
                </button>
                <button
                  onClick={onUndo}
                  className={`p-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
                    canUndo 
                      ? isDarkMode
                        ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      : isDarkMode
                        ? 'text-gray-600 cursor-not-allowed'
                        : 'text-gray-400 cursor-not-allowed'
                  }`}
                  title="Undo (Ctrl+Z)"
                  disabled={!canUndo}
                >
                  <RotateCcw size={20} />
                  <span className="text-sm">Undo</span>
                </button>
                <button
                  onClick={onReset}
                  className={`p-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
                    isDarkMode
                      ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title="Reset View (Center & Zoom 1x)"
                >
                  <RefreshCcw size={20} />
                  <span className="text-sm">Reset</span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div>
              <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Actions
              </h3>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={toggleTheme}
                  className={`p-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
                    isDarkMode
                      ? 'text-yellow-400 hover:text-yellow-300 hover:bg-gray-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
                >
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                  <span className="text-sm">Switch to {isDarkMode ? 'Light' : 'Dark'} Mode</span>
                </button>
                <button
                  onClick={onExport}
                  className={`p-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
                    isDarkMode
                      ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title="Export Drawing"
                >
                  <Download size={20} />
                  <span className="text-sm">Export Drawing</span>
                </button>
                <button
                  onClick={onClearCanvas}
                  className={`p-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
                    isDarkMode
                      ? 'text-gray-300 hover:text-red-400 hover:bg-red-900/20'
                      : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                  }`}
                  title="Clear Canvas"
                >
                  <Trash2 size={20} />
                  <span className="text-sm">Clear Canvas</span>
                </button>
              </div>
            </div>

            {/* User Count */}
            <div className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border ${
              isDarkMode
                ? 'bg-gray-800 border-gray-600'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <Users size={18} className="text-green-400" />
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{userCount}</span>
              <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>users online</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};