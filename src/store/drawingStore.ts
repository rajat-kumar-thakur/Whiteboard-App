import { create } from 'zustand';
import { DrawingElement, User } from '../types/drawing';

interface DrawingStore {
  elements: DrawingElement[];
  users: User[];
  selectedTool: string;
  selectedColor: string;
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  history: DrawingElement[][];
  redoStack: DrawingElement[][];
  addElement: (element: DrawingElement) => void;
  updateElement: (id: string, updates: Partial<DrawingElement>) => void;
  removeElement: (id: string) => void;
  setUsers: (users: User[]) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  setSelectedTool: (tool: string) => void;
  setSelectedColor: (color: string) => void;
  setViewport: (viewport: { x: number; y: number; zoom: number } | ((prev: { x: number; y: number; zoom: number }) => { x: number; y: number; zoom: number })) => void;
  resetViewport: () => void;
  clearCanvas: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useDrawingStore = create<DrawingStore>((set, get) => ({
  elements: [],
  users: [],
  selectedTool: 'pen',
  selectedColor: '#3b82f6',
  viewport: { x: 0, y: 0, zoom: 1 },
  history: [],
  redoStack: [],

  addElement: (element) => set(state => ({
    history: [...state.history, state.elements],
    redoStack: [],
    elements: [...state.elements, element]
  })),

  updateElement: (id, updates) => set(state => ({
    elements: state.elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    )
  })),

  removeElement: (id) => set(state => ({
    history: [...state.history, state.elements],
    redoStack: [],
    elements: state.elements.filter(el => el.id !== id)
  })),

  setUsers: (users) => set({ users }),

  updateUser: (userId, updates) => set(state => ({
    users: state.users.map(user => 
      user.id === userId ? { ...user, ...updates } : user
    )
  })),

  setSelectedTool: (tool) => set({ selectedTool: tool }),

  setSelectedColor: (color) => set({ selectedColor: color }),
  setViewport: (viewportOrUpdater) =>
    typeof viewportOrUpdater === 'function'
      ? set(state => ({ viewport: viewportOrUpdater(state.viewport) }))
      : set({ viewport: viewportOrUpdater }),

  resetViewport: () => set({ viewport: { x: 0, y: 0, zoom: 1 } }),

  clearCanvas: () => set(state => ({
    history: [...state.history, state.elements],
    redoStack: [],
    elements: []
  })),

  undo: () => set(state => {
    if (state.history.length === 0) return {};
    const prev = state.history[state.history.length - 1];
    const newHistory = state.history.slice(0, -1);
    return {
      elements: prev,
      history: newHistory,
      redoStack: [state.elements, ...state.redoStack]
    };
  }),

  redo: () => set(state => {
    if (state.redoStack.length === 0) return {};
    const next = state.redoStack[0];
    const newRedo = state.redoStack.slice(1);
    return {
      elements: next,
      history: [...state.history, state.elements],
      redoStack: newRedo
    };
  }),

  canUndo: () => get().history.length > 0,
  canRedo: () => get().redoStack.length > 0,
}));