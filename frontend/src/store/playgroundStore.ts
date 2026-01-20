import { create } from 'zustand';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

interface Breakpoint {
  id: string;
  file: string;
  line: number;
  enabled: boolean;
}

interface DebugSession {
  status: 'disconnected' | 'connected' | 'running' | 'paused';
  currentFrame?: {
    file: string;
    line: number;
    variables: Array<{ name: string; value: string }>;
  };
  variables: Array<{ name: string; value: string }>;
  callStack: Array<{ name: string; file: string; line: number }>;
}

interface Terminal {
  id: string;
  name: string;
}

interface PlaygroundState {
  userId: string | null;
  isLoading: boolean;
  isConnected: boolean;
  sidebarVisible: boolean;
  sidebarTab: string;
  terminalPanelVisible: boolean;
  terminalPanelHeight: number;
  previewVisible: boolean;
  files: FileNode[];
  openFiles: string[];
  activeFile: string | null;
  modifiedFiles: Set<string>;
  breakpoints: Breakpoint[];
  debugSession: DebugSession | null;
  terminals: Terminal[];
  activeTerminal: string | null;
  userContainer: { image: string; publicPort: number } | null;

  setUserId: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setConnected: (connected: boolean) => void;
  toggleSidebar: () => void;
  setSidebarTab: (tab: string) => void;
  toggleTerminalPanel: () => void;
  setTerminalPanelHeight: (height: number) => void;
  togglePreview: () => void;
  setFiles: (files: FileNode[]) => void;
  openFile: (path: string) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string | null) => void;
  updateFile: (path: string, content: string) => void;
  addBreakpoint: (bp: Breakpoint) => void;
  removeBreakpoint: (id: string) => void;
  setDebugSession: (session: DebugSession | null) => void;
  addTerminal: (terminal: Terminal) => void;
  removeTerminal: (id: string) => void;
  setActiveTerminal: (id: string | null) => void;
  setUserContainer: (container: { image: string; publicPort: number } | null) => void;
}

export const usePlaygroundStore = create<PlaygroundState>((set) => ({
  userId: null,
  isLoading: false,
  isConnected: false,
  sidebarVisible: true,
  sidebarTab: 'files',
  terminalPanelVisible: true,
  terminalPanelHeight: 180,
  previewVisible: false,
  files: [],
  openFiles: [],
  activeFile: null,
  modifiedFiles: new Set(),
  breakpoints: [],
  debugSession: null,
  terminals: [{ id: 'main', name: 'Main' }],
  activeTerminal: 'main',
  userContainer: null,

  setUserId: (id) => set({ userId: id }),
  setLoading: (loading) => set({ isLoading: loading }),
  setConnected: (connected) => set({ isConnected: connected }),
  toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),
  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  toggleTerminalPanel: () => set((state) => ({ terminalPanelVisible: !state.terminalPanelVisible })),
  setTerminalPanelHeight: (height) => set({ terminalPanelHeight: height }),
  togglePreview: () => set((state) => ({ previewVisible: !state.previewVisible })),
  setFiles: (files) => set({ files }),
  openFile: (path) => set((state) => ({
    openFiles: state.openFiles.includes(path) ? state.openFiles : [...state.openFiles, path],
    activeFile: path
  })),
  closeFile: (path) => set((state) => ({
    openFiles: state.openFiles.filter((p) => p !== path),
    activeFile: state.activeFile === path ? (state.openFiles[state.openFiles.indexOf(path) - 1] || null) : state.activeFile
  })),
  setActiveFile: (path) => set({ activeFile: path }),
  updateFile: (path) => set((state) => ({ modifiedFiles: new Set([...state.modifiedFiles, path]) })),
  addBreakpoint: (bp) => set((state) => ({ breakpoints: [...state.breakpoints, bp] })),
  removeBreakpoint: (id) => set((state) => ({ breakpoints: state.breakpoints.filter((b) => b.id !== id) })),
  setDebugSession: (session) => set({ debugSession: session }),
  addTerminal: (terminal) => set((state) => ({ terminals: [...state.terminals, terminal] })),
  removeTerminal: (id) => set((state) => ({
    terminals: state.terminals.filter((t) => t.id !== id),
    activeTerminal: state.activeTerminal === id ? 'main' : state.activeTerminal
  })),
  setActiveTerminal: (id) => set({ activeTerminal: id }),
  setUserContainer: (container) => set({ userContainer: container }),
}));
