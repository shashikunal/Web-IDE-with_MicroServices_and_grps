export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  content?: string;
  language?: string;
  children?: FileItem[];
}

export interface Terminal {
  id: string;
  name: string;
  pid?: number;
}

export interface Breakpoint {
  id: string;
  file: string;
  line: number;
  enabled: boolean;
  condition?: string;
}

export interface DebugSession {
  id: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'paused' | 'stopped';
  currentFrame?: {
    file: string;
    line: number;
    column: number;
    function?: string;
  };
  variables: DebugVariable[];
}

export interface DebugVariable {
  name: string;
  value: string;
  type: string;
  expandable?: boolean;
  children?: DebugVariable[];
}

export interface UserContainer {
  userId: string;
  containerId: string;
  image: string;
  publicPort: number;
  status: string;
}

export interface EditorState {
  files: FileItem[];
  openFiles: string[];
  activeFile: string | null;
  modifiedFiles: Set<string>;
  breakpoints: Breakpoint[];
  debugSession: DebugSession | null;
}

export interface TerminalState {
  terminals: Terminal[];
  activeTerminal: string | null;
}

export interface LayoutState {
  sidebarVisible: boolean;
  sidebarTab: 'files' | 'search' | 'git' | 'debug' | 'extensions';
  terminalPanelVisible: boolean;
  terminalPanelHeight: number;
  previewVisible: boolean;
  previewUrl: string | null;
}

export interface WebSocketMessage {
  type: 'container_ready' | 'data' | 'terminal_closed' | 'terminal_created' | 'error' | 'pong' | 'debug';
  userId?: string;
  terminalId?: string;
  data?: string;
  message?: string;
  payload?: unknown;
}
