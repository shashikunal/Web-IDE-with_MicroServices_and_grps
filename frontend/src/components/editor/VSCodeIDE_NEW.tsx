import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import * as Tabs from '@radix-ui/react-tabs';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import {
  Files,
  Search,
  GitBranch,
  Bug,
  Settings,
  X,
  ChevronRight,
  File,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
  Pencil,
  Copy,
  Clipboard,
  RefreshCw,
  Maximize2,
  Minimize2,
  Terminal as TerminalIcon,
  Save,
  Undo,
  Redo,
  Copy as CopyIcon,
  Command,
  X as Close,
  ArrowLeft,
  LogOut,
  Square,
  FilePlus,
  FolderPlus,
  MinusSquare,
  User as UserIcon
} from 'lucide-react';
import { useGetFileTreeQuery, useSaveFileMutation, useCreateFileMutation, useCreateDirectoryMutation, useDeleteFileMutation, useMoveFileMutation, useCopyFileMutation } from '../../store/api/apiSlice';
import type { Template, FileItem } from '../../store/api/apiSlice';
import FileExplorer from '../file-explorer/FileExplorer';
import CodeEditor from '../editor/CodeEditor';
import { TerminalPanel } from '../terminal/Terminal';
import Preview from '../editor/Preview';
import ContextMenu from '../context-menu/ContextMenu';
import CreateItemModal from './CreateItemModal';
import RenameItemModal from './RenameItemModal';
import DeleteItemModal from './DeleteItemModal';
import { Zap } from 'lucide-react';
import ApiTestPanel from '../api-test/ApiTestPanel';

interface Tab {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  modified: boolean;
}

interface Terminal {
  id: string;
  name: string;
  isActive: boolean;
}

type AppState = 'templates' | 'dashboard' | 'setup' | 'ready' | 'error';

interface VSCodeIDEProps {
  template: Template;
  userId: string;
  workspaceId: string;
  containerId: string;
  publicPort: number;
  setAppState: (state: AppState | ((state: AppState) => void)) => void;
}

const START_COMMANDS: Record<string, string> = {
  'react-app': 'echo -e "\\n\\033[1;36m🚀 Starting development server...\\033[0m" && CHOKIDAR_USEPOLLING=true npm run dev -- --host 0.0.0.0 --port 5173',
  'node-hello': 'echo -e "\\n\\033[1;36m🚀 Starting application...\\033[0m" && PORT=3000 npm start',
  'python-flask': 'echo -e "\\n\\033[1;36m🚀 Starting Flask server...\\033[0m" && python app.py',
  'go-api': 'echo -e "\\n\\033[1;36m🚀 Starting Go server...\\033[0m" && go run main.go',
  'html-site': 'echo -e "\\n\\033[1;36m🚀 Starting static server...\\033[0m" && npx serve -y -p 3000 .'
};

const ACTIVITY_BAR_ITEMS = [
  { id: 'explorer', icon: Files, label: 'Explorer' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'git', icon: GitBranch, label: 'Source Control' },
  { id: 'debug', icon: Bug, label: 'Run and Debug' },
  { id: 'extensions', icon: Settings, label: 'Extensions' },
  { id: 'api-test', icon: Zap, label: 'API Tester' },
];

const SIDEBAR_SECTIONS = [
  { id: 'outline', label: 'OUTLINE' },
  { id: 'timeline', label: 'TIMELINE' },
  { id: 'files', label: 'FILES' },
];

export default function VSCodeIDE({ template, userId, workspaceId, containerId, publicPort, setAppState }: VSCodeIDEProps) {
  const navigate = useNavigate();

  const [activeActivity, setActiveActivity] = useState('explorer');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [username, setUsername] = useState('User');

  useEffect(() => {
    const updateUsername = () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const u = JSON.parse(userStr);
          if (u.username) setUsername(u.username);
        } else {
          setUsername('User');
        }
      } catch (e) {
        console.error('Failed to parse user', e);
      }
    };

    updateUsername();

    // Listen for storage events to sync across tabs/components
    window.addEventListener('storage', updateUsername);
    return () => window.removeEventListener('storage', updateUsername);
  }, [userId]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setAppState('templates');
  };
  const [activeSidebarTab, setActiveSidebarTab] = useState('files');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showPanel, setShowPanel] = useState(true);
  const [panelHeight, setPanelHeight] = useState(200);
  const [sidebarWidth, setSidebarWidth] = useState(260);

  // New state for Preview Toggle
  const [showPreview, setShowPreview] = useState(template.hasPreview);

  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['']));
  const [terminals, setTerminals] = useState<Terminal[]>([
    { id: 'main', name: 'Terminal', isActive: true }
  ]);
  const [activeTerminalId, setActiveTerminalId] = useState<string>('main');
  const [panelTab, setPanelTab] = useState<'terminal' | 'output' | 'problems' | 'debug'>('terminal');

  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    type: 'file' | 'folder' | 'background';
    path?: string;
    name?: string;
  }>({ visible: false, x: 0, y: 0, type: 'background' });

  const [clipboard, setClipboard] = useState<{ type: 'file' | 'folder'; path: string } | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalType, setCreateModalType] = useState<'file' | 'folder'>('file');
  const [createModalPath, setCreateModalPath] = useState('/');

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renamePath, setRenamePath] = useState('');
  const [renameCurrentName, setRenameCurrentName] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteData, setDeleteData] = useState<{ path: string; name: string; type: 'file' | 'folder' } | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const terminalWritersRef = useRef<Map<string, (data: string) => void>>(new Map());

  const [fileTree, setFileTree] = useState<FileItem | null>(null);
  const { data: initialTree, refetch: refetchFileTree } = useGetFileTreeQuery({ userId, workspaceId }, { skip: !userId || !workspaceId });
  const [saveFile] = useSaveFileMutation();
  const [createFileMutation] = useCreateFileMutation();
  const [createDirectory] = useCreateDirectoryMutation();
  const [deleteFile] = useDeleteFileMutation();
  const [moveFile] = useMoveFileMutation();
  const [copyFile] = useCopyFileMutation();
  const [isExplorerCollapsed, setIsExplorerCollapsed] = useState(false);

  /* 
   * Terminal Refresh State
   * Used to force terminal refresh when layout changes (sidebar toggle, activity switch)
   */
  const [lastTerminalRefresh, setLastTerminalRefresh] = useState(0);

  // Trigger terminal refresh when layout-affecting state changes
  useEffect(() => {
    // Small delay to allow layout to settle
    const timer = setTimeout(() => {
      setLastTerminalRefresh(Date.now());
    }, 100);
    return () => clearTimeout(timer);
  }, [activeActivity, showSidebar, isExplorerCollapsed, showPanel, panelHeight, showPreview]);

  // Ensure showPreview corresponds to template initially, but allow toggle
  useEffect(() => {
    if (template.hasPreview && !showPreview) setShowPreview(true);
  }, [template.id]);

  const currentTab = tabs.find(t => t.id === activeTab);
  const activeTerminal = terminals.find(t => t.id === activeTerminalId) || terminals[0];

  useEffect(() => {
    if (initialTree) {
      setFileTree(initialTree);
    }
  }, [initialTree]);

  useEffect(() => {
    if (fileTree && fileTree.children && fileTree.children.length > 0) {
      handleFolderToggle('');
    }
  }, [fileTree]);

  const updateFolderChildren = useCallback((path: string, children: FileItem[]) => {
    setFileTree(prev => {
      if (!prev) return prev;

      const updateItem = (node: FileItem): FileItem => {
        if (node.path === path) {
          const uniqueChildren: FileItem[] = [];
          const seenPaths = new Set<string>();

          for (const child of children) {
            if (!seenPaths.has(child.path)) {
              seenPaths.add(child.path);
              uniqueChildren.push(child);
            }
          }

          return { ...node, children: uniqueChildren };
        }
        if (node.children) {
          return { ...node, children: node.children.map(updateItem) };
        }
        return node;
      };

      return updateItem(prev);
    });
  }, []);

  const fetchFolderContent = useCallback(async (path: string) => {
    const normalizedPath = path.replace(/^\//, '');
    try {
      // Use '/' for root if normalizedPath is empty, to be safe for API
      const queryPath = normalizedPath || '/';
      const response = await fetch(`/api/workspaces/${workspaceId}/files?path=${encodeURIComponent(queryPath)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Ensure all items have children arrays to prevent React iteration errors
        const items = (data.files || []).map((item: any) => ({
          ...item,
          children: item.children || []
        }));
        updateFolderChildren(path, items);
      }
    } catch (err) {
      console.error('Failed to fetch folder:', err);
    }
  }, [userId, updateFolderChildren]);

  useEffect(() => {
    if (fileTree && (!fileTree.children || fileTree.children.length === 0)) {
      fetchFolderContent(fileTree.path);
    }
  }, [fileTree, fetchFolderContent]);

  const handleFolderToggle = useCallback(async (path: string) => {
    if (!path) return;

    setExpandedFolders(prev => {
      const isExpanded = prev.has(path);

      if (isExpanded) {
        const next = new Set(prev);
        next.delete(path);
        return next;
      }

      // Fetch content when opening
      setTimeout(() => fetchFolderContent(path), 0);

      return new Set([...prev, path]);
    });
  }, [fetchFolderContent]);

  const handleMenuAction = useCallback((action: string) => {
    setActiveMenu(null);

    switch (action) {
      case 'newFile':
        setCreateModalType('file');
        setCreateModalPath('/');
        setShowCreateModal(true);
        break;
      case 'newFolder':
        setCreateModalType('folder');
        setCreateModalPath('/');
        setShowCreateModal(true);
        break;
      case 'save':
        if (activeTab) handleSave(activeTab);
        break;
      case 'saveAll':
        for (const tab of tabs.filter(t => t.modified)) {
          saveFile({ userId, workspaceId, path: tab.path, content: tab.content });
        }
        toast.success('All files saved');
        break;
      case 'closeEditor':
        if (activeTab) handleTabClose(activeTab);
        break;
      case 'exit':
        handleExit();
        break;
      case 'toggleExplorer':
        setShowSidebar(prev => !prev);
        break;
      case 'toggleTerminal':
        setShowPanel(prev => !prev);
        break;
      case 'togglePreview':
        setShowPreview(prev => !prev);
        break;
      case 'newTerminal':
        addTerminal();
        break;
      case 'welcome':
        toast.success('Welcome to Code Playground!');
        break;
      default:
        toast(`Action: ${action}`, { icon: 'ℹ️' });
    }
  }, [activeTab, tabs, userId, saveFile]);

  const handleContextMenuAction = async (action: string, path?: string) => {
    console.log(`[ContextMenu] Action: ${action}, Path: ${path}, Name: ${contextMenu.name}`);
    setContextMenu(prev => ({ ...prev, visible: false }));

    switch (action) {
      case 'newFile':
        setCreateModalType('file');
        setCreateModalPath(path || '/');
        setShowCreateModal(true);
        break;
      case 'newFolder':
        setCreateModalType('folder');
        setCreateModalPath(path || '/');
        setShowCreateModal(true);
        break;
      case 'rename':
        if (path) {
          setRenamePath(path);
          setRenameCurrentName(contextMenu.name || '');
          setShowRenameModal(true);
        }
        break;
      case 'delete':
        if (path) {
          setDeleteData({
            path,
            name: contextMenu.name || 'item',
            type: contextMenu.type === 'folder' ? 'folder' : 'file'
          });
          setShowDeleteModal(true);
        }
        break;
      case 'copy':
        if (path && (contextMenu.type === 'file' || contextMenu.type === 'folder')) {
          setClipboard({ type: contextMenu.type as 'file' | 'folder', path });
          toast.success('Copied to clipboard');
        }
        break;
      case 'paste':
        if (clipboard && path) {
          const sourceName = clipboard.path.split('/').pop();
          let destDir = path;
          if (contextMenu.type === 'file') {
            destDir = path.split('/').slice(0, -1).join('/') || '';
          }

          const destPath = destDir ? `${destDir}/${sourceName}` : sourceName;

          if (clipboard.path === destPath) {
            toast.error('Cannot paste into same location with same name');
            break;
          }

          try {
            await copyFile({ userId, workspaceId, sourcePath: clipboard.path, destinationPath: destPath || '' }).unwrap();
            toast.success('Pasted successfully');
            refetchFileTree();
          } catch {
            toast.error('Failed to paste');
          }
        }
        break;
      case 'copyPath':
        if (path) {
          navigator.clipboard.writeText(path);
          toast.success('Path copied');
        }
        break;
    }
  };

  const handleMoveFile = async (src: string, dest: string) => {
    try {
      await moveFile({ userId, workspaceId, sourcePath: src, destinationPath: dest }).unwrap();
      toast.success('Moved successfully');
      refetchFileTree();
    } catch (err: any) {
      toast.error(err?.data?.error || 'Failed to move file');
    }
  };

  const handleRefreshExplorer = () => {
    refetchFileTree();
  };

  const handleCreateItem = async (name: string, type: 'file' | 'folder') => {
    const fullPath = createModalPath === '/' ? name : `${createModalPath}/${name}`;
    const parentPath = createModalPath;

    const newItem: FileItem = {
      id: fullPath,
      name,
      path: fullPath,
      type: type === 'folder' ? 'directory' : 'file',
      isFolder: type === 'folder'
    };

    if (type === 'file') {
      try {
        await createFileMutation({ userId, workspaceId, path: fullPath, content: '' }).unwrap();
        toast.success(`Created: ${name}`);
        addItemToTree(parentPath, newItem, false);
      } catch {
        toast.error('Failed to create file');
      }
    } else {
      try {
        await createDirectory({ userId, workspaceId, path: fullPath }).unwrap();
        toast.success(`Created folder: ${name}`);
        addItemToTree(parentPath, newItem, false);
      } catch {
        toast.error('Failed to create folder');
      }
    }
  };

  const handleRename = async (newName: string) => {
    if (!renamePath) return;

    const currentDir = renamePath.split('/').slice(0, -1).join('/') || '';
    const newPath = currentDir ? `${currentDir}/${newName}` : newName;

    try {
      await moveFile({ userId, workspaceId, sourcePath: renamePath, destinationPath: newPath }).unwrap();
      toast.success('Renamed successfully');
      refetchFileTree();
    } catch {
      toast.error('Failed to rename');
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteData) return;

    try {
      await deleteFile({ userId, workspaceId, path: deleteData.path }).unwrap();
      toast.success('Deleted successfully');
      deleteItemFromTree(deleteData.path);
      refetchFileTree();

      const openTab = tabs.find(t => t.path === deleteData.path);
      if (openTab) {
        handleTabClose(openTab.id);
      }

      setShowDeleteModal(false);
      setDeleteData(null);
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const addItemToTree = useCallback((parentPath: string, item: FileItem, allowDuplicates = true) => {
    setFileTree(prev => {
      if (!prev) return prev;

      const findAndAdd = (node: FileItem): FileItem => {
        if (node.path === parentPath && node.children) {
          const exists = node.children.some(child => child.path === item.path);
          if (exists && !allowDuplicates) {
            return node;
          }
          const newChildren = exists
            ? node.children.map(child => child.path === item.path ? item : child)
            : [...node.children, item];
          return { ...node, children: newChildren.sort((a, b) => a.name.localeCompare(b.name)) };
        }
        if (node.children) {
          return { ...node, children: node.children.map(findAndAdd) };
        }
        return node;
      };

      if (parentPath === '/' || parentPath === '') {
        const exists = prev.children?.some(child => child.path === item.path);
        if (exists && !allowDuplicates) {
          return prev;
        }
        const newChildren = exists
          ? prev.children!.map(child => child.path === item.path ? item : child)
          : [...(prev.children || []), item];
        return { ...prev, children: newChildren.sort((a, b) => a.name.localeCompare(b.name)) };
      }

      return findAndAdd(prev);
    });
  }, []);

  const deleteItemFromTree = useCallback((path: string) => {
    setFileTree(prev => {
      if (!prev) return prev;

      const removeFromItem = (node: FileItem): FileItem | null => {
        if (node.path === path) {
          return null;
        }
        if (node.children) {
          const filtered = node.children.map(removeFromItem).filter(Boolean) as FileItem[];
          return { ...node, children: filtered };
        }
        return node;
      };

      return removeFromItem(prev);
    });
  }, []);

  const addTerminal = useCallback(() => {
    const newId = `terminal-${Date.now()}`;
    setTerminals(prev => [
      ...prev.map(t => ({ ...t, isActive: false })),
      { id: newId, name: `Terminal ${prev.length + 1}`, isActive: true }
    ]);
    setActiveTerminalId(newId);
  }, []);

  const closeTerminal = useCallback((id: string) => {
    if (terminals.length === 1) {
      toast.error('Cannot close the last terminal');
      return;
    }
    const closingActive = activeTerminalId === id;
    const newTerminals = terminals.filter(t => t.id !== id);

    setTerminals(newTerminals);

    if (closingActive && newTerminals.length > 0) {
      const last = newTerminals[newTerminals.length - 1];
      setActiveTerminalId(last.id);
      setTerminals(prev => prev.map(t => t.id === last.id ? { ...t, isActive: true } : t));
    }
  }, [terminals, activeTerminalId]);

  const switchTerminal = useCallback((id: string) => {
    setActiveTerminalId(id);
    setTerminals(prev => prev.map(t => ({ ...t, isActive: t.id === id })));
  }, []);

  const openFile = useCallback(async (file: FileItem) => {
    const existing = tabs.find(t => t.path === file.path);
    if (existing) {
      setActiveTab(existing.id);
      return;
    }

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/file?path=${encodeURIComponent(file.path)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (!response.ok) throw new Error('Failed to open file');
      const data = await response.json();

      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const langMap: Record<string, string> = {
        js: 'javascript', ts: 'typescript', jsx: 'javascript', tsx: 'typescript',
        py: 'python', go: 'go', cpp: 'cpp', rs: 'rust', java: 'java',
        html: 'html', css: 'css', json: 'json', md: 'markdown', sh: 'shell',
        yaml: 'yaml', dockerfile: 'dockerfile'
      };

      const newTab: Tab = {
        id: file.path,
        name: file.name,
        path: file.path,
        content: data.content || '',
        language: langMap[ext] || 'plaintext',
        modified: false,
      };

      setTabs(prev => [...prev, newTab]);
      setActiveTab(newTab.id);
    } catch {
      toast.error(`Failed to open: ${file.name}`);
    }
  }, [userId, tabs]);

  const socketsRef = useRef<Map<string, WebSocket>>(new Map());
  const terminalHistoryRef = useRef<Record<string, string>>({});

  const connectTerminal = useCallback((terminalId: string, isMain: boolean) => {
    if (socketsRef.current.has(terminalId)) return;
    if (!containerId || containerId === 'null') return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//localhost:3000/ws?userId=${userId}&termId=${terminalId}&containerId=${containerId}`;
    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer'; // Handle binary data as ArrayBuffer

    socketsRef.current.set(terminalId, ws);

    ws.onopen = () => {
      if (isMain) setIsConnected(true);

      const welcomeMessage = [
        '\r\n\x1b[38;5;33m┌──────────────────────────────────────────────────────────────┐\x1b[0m',
        '\x1b[38;5;33m│                                                              │\x1b[0m',
        `\x1b[38;5;33m│  \x1b[1;37mWelcome to Cloud IDE\x1b[0m ${isMain ? '(Main)' : '(Secondary)'}                          \x1b[38;5;33m│\x1b[0m`,
        `\x1b[38;5;33m│  \x1b[36mEnvironment\x1b[0m:    ${template.name.padEnd(36)} \x1b[38;5;33m│\x1b[0m`,
        `\x1b[38;5;33m│  \x1b[36mPort\x1b[0m:           ${publicPort.toString().padEnd(36)} \x1b[38;5;33m│\x1b[0m`,
        `\x1b[38;5;33m│  \x1b[36mStatus\x1b[0m:         \x1b[32m● Online\x1b[0m                                \x1b[38;5;33m│\x1b[0m`,
        '\x1b[38;5;33m│                                                              │\x1b[0m',
        '\x1b[38;5;33m└──────────────────────────────────────────────────────────────┘\x1b[0m',
        '\r\n'
      ].join('\r\n');

      terminalHistoryRef.current[terminalId] = (terminalHistoryRef.current[terminalId] || '') + welcomeMessage;

      const writer = terminalWritersRef.current.get(terminalId);
      if (writer) writer(welcomeMessage);

      if (isMain) {
        const startCmd = START_COMMANDS[template.id];
        if (startCmd) {
          setTimeout(() => {
            const externalUrl = `http://127.0.0.1:${publicPort}`;
            const echoCmd = `echo -e "\\n\\033[1;33m⚡ Initializing development environment...\\033[0m\\n\\n\\033[1;32m   >>> Access your application at: \x1b[4m${externalUrl}\x1b[0m\\033[1;32m <<<\\033[0m\\n"`;
            ws.send(`${echoCmd} && ${startCmd}\n`);
          }, 1500);
        }
      }
    };


    ws.onmessage = (event) => {
      let data = event.data;

      // Convert ArrayBuffer to string if needed
      if (data instanceof ArrayBuffer) {
        const decoder = new TextDecoder();
        data = decoder.decode(data);
      }

      terminalHistoryRef.current[terminalId] = (terminalHistoryRef.current[terminalId] || '') + data;
      const writer = terminalWritersRef.current.get(terminalId);
      if (writer) writer(data);
    };

    ws.onclose = () => {
      if (isMain) setIsConnected(false);
      socketsRef.current.delete(terminalId);
    };

    ws.onerror = () => {
      if (isMain) setIsConnected(false);
    };

  }, [userId, template.id, template.name, containerId]);

  useEffect(() => {
    if (!userId) return;
    terminals.forEach(t => {
      if (!socketsRef.current.has(t.id)) {
        connectTerminal(t.id, t.id === 'main');
      }
    });

    const activeIds = new Set(terminals.map(t => t.id));
    socketsRef.current.forEach((ws, id) => {
      if (!activeIds.has(id)) {
        ws.close();
        socketsRef.current.delete(id);
      }
    });
  }, [terminals, userId, connectTerminal]);

  useEffect(() => {
    return () => {
      socketsRef.current.forEach(ws => ws.close());
      socketsRef.current.clear();
    };
  }, []);

  const handleTerminalData = useCallback((terminalId: string, data: string) => {
    const ws = socketsRef.current.get(terminalId);
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }, []);

  const handleTerminalResize = useCallback((terminalId: string, cols: number, rows: number) => {
    const ws = socketsRef.current.get(terminalId);
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'resize', cols, rows }));
    }
  }, []);

  const handleTerminalReady = useCallback((terminalId: string, writer: { write: (data: string) => void }) => {
    terminalWritersRef.current.set(terminalId, writer.write);
  }, []);

  const autoSaveTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const handleContentChange = (tabId: string, content: string) => {
    setTabs(prev => prev.map(tab =>
      tab.id === tabId ? { ...tab, content, modified: true } : tab
    ));

    const existingTimeout = autoSaveTimeoutsRef.current.get(tabId);
    if (existingTimeout) clearTimeout(existingTimeout);

    const timeout = setTimeout(async () => {
      const tab = tabs.find(t => t.id === tabId);
      try {
        const currentTab = tabs.find(t => t.id === tabId);
        if (currentTab) {
          await saveFile({ userId, workspaceId, path: currentTab.path, content }).unwrap();
          setTabs(prev => prev.map(t => t.id === tabId ? { ...t, modified: false } : t));
        }
      } catch (err) {
        console.error('Auto-save failed', err);
      }
    }, 1000);

    autoSaveTimeoutsRef.current.set(tabId, timeout);
  };

  const handleSave = async (tabId: string) => {
    const existingTimeout = autoSaveTimeoutsRef.current.get(tabId);
    if (existingTimeout) clearTimeout(existingTimeout);

    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;

    try {
      await saveFile({ userId, workspaceId, path: tab.path, content: tab.content }).unwrap();
      setTabs(prev => prev.map(t => t.id === tabId ? { ...t, modified: false } : t));
      toast.success('File saved');
    } catch (err) {
      toast.error(`Failed to save: ${tab.name}`);
    }
  };

  const handleTabClose = (id: string) => {
    const tab = tabs.find(t => t.id === id);
    if (tab?.modified) {
      toast((t) => (
        <div className="flex flex-col gap-2">
          <div className="text-sm">Save changes to {tab.name}?</div>
          <div className="flex gap-2">
            <button
              onClick={() => { handleSave(id); closeTab(id); toast.dismiss(t.id); }}
              className="px-3 py-1 bg-[#007acc] text-white text-xs rounded"
            >
              Save
            </button>
            <button
              onClick={() => { closeTab(id); toast.dismiss(t.id); }}
              className="px-3 py-1 bg-[#4d4d4d] text-white text-xs rounded"
            >
              Don't Save
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 text-gray-400 text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      ), { duration: Infinity });
    } else {
      closeTab(id);
    }
  };

  const closeTab = (id: string) => {
    const index = tabs.findIndex(t => t.id === id);
    const newTabs = tabs.filter(t => t.id !== id);
    if (activeTab === id && newTabs.length > 0) {
      setActiveTab(newTabs[Math.max(0, index - 1)].id);
    }
    setTabs(newTabs);
  };

  const handleExit = () => {
    navigate('/dashboard');
  };

  const handleContextMenu = (e: React.MouseEvent, type: 'file' | 'folder' | 'background', path?: string, name?: string) => {
    e.preventDefault();
    setActiveMenu(null);
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, type, path, name });
  };

  const handleContextMenuClose = () => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  interface MenuItem {
    label?: string;
    shortcut?: string;
    divider?: boolean;
  }

  interface Menu {
    label: string;
    items: MenuItem[];
  }

  const MENU_ITEMS: Menu[] = [
    {
      label: 'Terminal', items: [
        { label: 'New Terminal', shortcut: '⌘⇧`' },
        { divider: true },
        { label: 'Clear' },
        { divider: true },
        { label: 'Run Build Task' },
      ]
    },
  ];

  const terminalPanelContent = useMemo(() => (
    <TerminalPanel
      terminals={terminals}
      activeTerminalId={activeTerminalId}
      visible={showPanel}
      onTerminalChange={switchTerminal}
      onTerminalClose={closeTerminal}
      onTerminalAdd={addTerminal}
      onData={handleTerminalData}
      onResize={handleTerminalResize}
      onTerminalReady={handleTerminalReady}
      initialData={terminalHistoryRef.current}
      lastRefresh={lastTerminalRefresh}
    />
  ), [terminals, activeTerminalId, showPanel, switchTerminal, closeTerminal, handleTerminalData, handleTerminalResize, handleTerminalReady, lastTerminalRefresh]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#1e1e1e] text-[#cccccc] overflow-hidden font-sans">
      <Toaster position="top-right" />

      {/* Title Bar */}
      <div className="h-8 flex items-center bg-[#1e1e1e] border-b border-[#2b2b2b] select-none">
        <div className="flex items-center gap-2 px-4">
          <div className="flex gap-2 group">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#ff5f56]/80 transition-colors" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#ffbd2e]/80 transition-colors" />
            <div className="w-3 h-3 rounded-full bg-[#27ca40] hover:bg-[#27ca40]/80 transition-colors" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-[#cccccc] hover:bg-[#333333] hover:text-white rounded-md transition-colors"
            title="Go Back to Dashboard"
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <div className="h-4 w-[1px] bg-[#333333]" />
          <img src="/vscode-logo.svg" alt="VS Code" className="w-5 h-5 block" />
          <div className="flex items-center gap-1 text-[13px]">
            <span className="font-normal text-[#cccccc]">Code Playground</span>
            <span className="text-[#858585] mx-1">-</span>
            <span className="font-medium text-white">{template?.name || 'Workspace'}</span>
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-3 mr-4">
          <button
            onClick={() => handleMenuAction('save')}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#007acc] hover:bg-[#0062a3] text-white rounded-[2px] text-xs font-medium transition-colors shadow-sm"
          >
            <Save size={13} />
            Save
          </button>

          <div className="relative z-50">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 px-2 py-1 hover:bg-[#333333] rounded-md text-[#cccccc] transition-colors"
            >
              <div className="w-5 h-5 bg-[#007acc] rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                {username.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs hidden md:block">{username}</span>
            </button>

            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-[#252526] border border-[#454545] rounded-md shadow-lg py-1 z-[9999]">
                  <div className="px-3 py-2 border-b border-[#454545]">
                    <p className="text-xs font-medium text-white">{username}</p>
                    <p className="text-[10px] text-[#858585] truncate">Logged in</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-xs text-[#cccccc] hover:bg-[#04395e] hover:text-white flex items-center gap-2"
                  >
                    <LogOut size={12} />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Menu Bar */}
      <div className="h-7 flex items-center bg-[#1e1e1e] border-b border-[#2b2b2b] px-2 select-none relative z-50">
        <div className="flex items-center gap-1 h-full">
          {MENU_ITEMS.map((menu) => (
            <div key={menu.label} className="relative h-full">
              <button
                id={`menu-btn-${menu.label}`}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setActiveMenu(activeMenu === menu.label ? null : menu.label);
                }}
                className={`h-full px-3 text-[13px] font-normal text-[#cccccc] hover:bg-[#3d3d3d] hover:text-white transition-colors cursor-default select-none flex items-center rounded-sm ${activeMenu === menu.label ? 'bg-[#3d3d3d] text-white' : ''
                  }`}
              >
                {menu.label}
              </button>
              {activeMenu === menu.label && (
                <div
                  className="absolute left-0 top-full bg-[#1e1e1e] border border-[#454545] rounded-lg shadow-2xl z-[9999] min-w-[220px] py-1 focus:outline-none flex flex-col mt-1"
                >
                  {menu.items.map((item, i) => (
                    item.divider ? (
                      <div key={i} className="h-[1px] bg-[#454545] my-1 w-full" />
                    ) : (
                      <button
                        key={i}
                        onClick={() => item.label && handleMenuAction(item.label.toLowerCase().replace(/\s+/g, ''))}
                        className="w-full flex items-center px-3 py-1.5 text-[13px] text-[#cccccc] hover:bg-[#04395e] hover:text-white transition-colors text-left group gap-4 relative"
                      >
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.shortcut && (
                          <span className="text-[#858585] text-xs font-normal group-hover:text-white">{item.shortcut}</span>
                        )}
                      </button>
                    )
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {activeMenu && <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />}

      {/* Main Layout (Resizable Panels) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Activity Bar */}
        <div className="w-[48px] flex flex-col items-center py-2 bg-[#333333] border-r border-[#252526] z-20">
          {ACTIVITY_BAR_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveActivity(item.id);
                if (!showSidebar) setShowSidebar(true);
              }}
              className={`p-3 mb-2 rounded-md transition-colors relative group ${activeActivity === item.id ? 'text-white' : 'text-[#858585] hover:text-white'
                }`}
              title={item.label}
            >
              <item.icon size={24} strokeWidth={1.5} />
              {activeActivity === item.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-8 bg-white rounded-r"></div>
              )}
            </button>
          ))}
          <div className="flex-1" />
          <button
            className="p-3 mb-2 text-[#858585] hover:text-white transition-colors"
            onClick={() => setShowProfileMenu(prev => !prev)}
            title="Accounts"
          >
            <UserIcon size={24} strokeWidth={1.5} />
          </button>
          <button
            className="p-3 text-[#858585] hover:text-white transition-colors"
            title="Settings"
          >
            <Settings size={24} strokeWidth={1.5} />
          </button>
        </div>

        {/* Main Resizable Layout */}
        <div className="flex-1 flex overflow-hidden">
          <PanelGroup direction="horizontal">
            {showSidebar && (
              <>
                <Panel defaultSize={20} minSize={10} maxSize={30} className="flex flex-col bg-[#252526] min-w-[170px]">
                  {/* Sidebar Header */}
                  <div className="flex items-center justify-between h-9 px-4 text-xs font-medium bg-[#252526] select-none uppercase tracking-wide">
                    <span>{ACTIVITY_BAR_ITEMS.find(i => i.id === activeActivity)?.label || 'EXPLORER'}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={handleRefreshExplorer} className="p-1 hover:bg-[#333] rounded">
                        <RefreshCw size={12} />
                      </button>
                      <button className="p-1 hover:bg-[#333] rounded" onClick={() => setShowSidebar(false)}>
                        <MinusSquare size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Sidebar Content */}
                  {activeActivity === 'explorer' && (
                    <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                      {/* File Explorer Components */}
                      <div className="flex flex-col h-full">
                        <div className="group flex items-center justify-between px-4 py-1 hover:bg-[#2a2d2e] cursor-pointer select-none">
                          <div
                            className="flex items-center gap-1 flex-1 overflow-hidden"
                            onClick={() => setIsExplorerCollapsed(!isExplorerCollapsed)}
                          >
                            <ChevronRight
                              size={14}
                              className={`text-[#858585] transition-transform ${!isExplorerCollapsed ? 'rotate-90' : ''}`}
                            />
                            <span className="text-xs font-bold text-[#bbbbbb] group-hover:text-white uppercase truncate">
                              {template.name || 'Workspace'}
                            </span>
                          </div>
                          <div className="flex items-center mr-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRefreshExplorer();
                              }}
                              className="p-1 hover:bg-[#3c3c3c] rounded text-[#858585] hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                              title="Refresh Explorer"
                            >
                              <RefreshCw size={12} />
                            </button>
                          </div>
                        </div>
                        <div className={`flex-1 overflow-hidden ${isExplorerCollapsed ? 'hidden' : ''}`}>
                          <FileExplorer
                            files={fileTree ? [fileTree] : []}
                            onFileSelect={openFile}
                            onFolderToggle={handleFolderToggle}
                            expandedFolders={expandedFolders}
                            onContextMenu={handleContextMenu}
                            onMove={handleMoveFile}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {activeActivity === 'api-test' && (
                    <ApiTestPanel />
                  )}
                  {activeActivity === 'search' && (
                    <div className="p-4">
                      <div className="relative">
                        <input type="text" placeholder="Search" className="w-full bg-[#3c3c3c] text-[#cccccc] px-2 py-1 border border-transparent focus:border-[#007acc] outline-none text-sm placeholder-[#858585]" />
                      </div>
                      <div className="mt-4 text-xs text-[#858585] text-center">No results found</div>
                    </div>
                  )}
                </Panel>
                <PanelResizeHandle className="w-1 bg-[#1e1e1e] hover:bg-[#007acc] transition-colors cursor-col-resize" />
              </>
            )}

            <Panel>
              <PanelGroup direction="vertical">
                <Panel defaultSize={showPanel ? 70 : 100} minSize={20}>
                  <PanelGroup direction="horizontal">
                    <Panel defaultSize={showPreview ? 50 : 100} minSize={20} className="flex flex-col bg-[#1e1e1e]">
                      {/* Tabs Header with Preview Toggle */}
                      {tabs.length > 0 ? (
                        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
                          <div className="flex items-center justify-between h-9 bg-[#252526] border-b border-[#1e1e1e]">
                            <Tabs.List className="flex items-center h-full overflow-x-auto flex-1">
                              {tabs.map((tab) => (
                                <Tabs.Trigger
                                  key={tab.id}
                                  value={tab.id}
                                  className={`flex items-center gap-1.5 h-full px-3 text-xs border-r border-[#1e1e1e] transition-colors outline-none data-[state=active]:bg-[#1e1e1e] data-[state=active]:text-[#ffffff] data-[state=active]:border-t-2 data-[state=active]:border-t-[#007acc] hover:bg-[#2d2d2d] hover:text-[#cccccc]`}
                                >
                                  <File size={14} className={activeTab === tab.id ? 'text-[#007acc]' : '#858585'} />
                                  <span className="truncate max-w-[120px]">{tab.name}</span>
                                  {tab.modified && <span className="text-[#007acc]">●</span>}
                                  <Close
                                    size={14}
                                    className="ml-0.5 opacity-0 group-hover:opacity-100 hover:text-[#f5c2e7] transition-all"
                                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleTabClose(tab.id); }}
                                  />
                                </Tabs.Trigger>
                              ))}
                            </Tabs.List>
                            <div className="flex items-center px-2 border-l border-[#1e1e1e]">
                              <button
                                onClick={() => setShowPreview(!showPreview)}
                                className={`p-1 rounded ${showPreview ? 'text-white bg-[#333]' : 'text-[#858585] hover:text-white'}`}
                                title={showPreview ? "Hide Preview" : "Show Preview"}
                              >
                                <Maximize2 size={14} className={showPreview ? "rotate-180" : ""} />
                              </button>
                            </div>
                          </div>
                        </Tabs.Root>
                      ) : <div className="h-9 bg-[#252526]"></div>}

                      {/* Editor */}
                      <div className="flex-1 overflow-hidden">
                        <CodeEditor
                          tabs={tabs}
                          activeTab={activeTab}
                          onTabChange={setActiveTab}
                          onTabClose={handleTabClose}
                          onContentChange={handleContentChange}
                          onSave={handleSave}
                        />
                      </div>
                    </Panel>

                    {showPreview && (
                      <>
                        <PanelResizeHandle className="w-1 bg-[#252526] hover:bg-[#007acc] transition-colors cursor-col-resize" />
                        <Panel defaultSize={50} minSize={20} className="bg-[#1e1e1e] border-l border-[#1e1e1e]">
                          <Preview url={`http://localhost:${publicPort}`} visible={true} />
                        </Panel>
                      </>
                    )}
                  </PanelGroup>
                </Panel>

                {showPanel && (
                  <>
                    <PanelResizeHandle className="h-1 bg-[#252526] hover:bg-[#007acc] transition-colors cursor-row-resize" />
                    <Panel defaultSize={30} minSize={10} className="bg-[#1e1e1e] border-t border-[#1e1e1e]">
                      {/* Panel Header */}
                      <div className="flex items-center h-[35px] bg-[#1e1e1e] border-b border-[#2b2b2b] px-4 gap-6 select-none">
                        <div className="flex items-center h-full gap-4">
                          {['terminal', 'output', 'problems', 'debug'].map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setPanelTab(tab as typeof panelTab)}
                              className={`
                                relative h-full text-[11px] uppercase tracking-wide transition-all border-b mt-[1px] 
                                ${panelTab === tab
                                  ? 'text-white border-white'
                                  : 'text-[#969696] border-transparent hover:text-[#cccccc]'
                                }
                              `}
                            >
                              {tab}
                            </button>
                          ))}
                        </div>
                        <div className="flex-1 flex items-center justify-end gap-2">
                          {panelTab === 'terminal' && (
                            <>
                              <button
                                onClick={() => {
                                  const startCmd = START_COMMANDS[template.id];
                                  const ws = socketsRef.current.get(activeTerminalId);
                                  if (startCmd && ws?.readyState === WebSocket.OPEN) {
                                    ws.send('\x03');
                                    setTimeout(() => {
                                      if (ws?.readyState === WebSocket.OPEN) {
                                        ws.send(startCmd + '\n');
                                        toast.success('Server restarted');
                                      }
                                    }, 1000);
                                  }
                                }}
                                title="Restart Server"
                                className="p-1 hover:bg-[#3e3e42] rounded text-[#cccccc] transition-colors"
                              >
                                <RefreshCw size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  const ws = socketsRef.current.get(activeTerminalId);
                                  if (ws?.readyState === WebSocket.OPEN) {
                                    ws.send('\x03');
                                    toast.success('Sent kill signal (SIGINT)');
                                  }
                                }}
                                title="Kill Process"
                                className="p-1 hover:bg-[#3e3e42] rounded text-[#cccccc] transition-colors"
                              >
                                <Square size={14} fill="currentColor" className="scale-75" />
                              </button>
                            </>
                          )}

                          <button onClick={() => setShowPanel(false)} className="p-1 hover:bg-[#3e3e42] rounded text-[#858585] hover:text-white transition-colors" title="Close Panel">
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 h-[calc(100%-35px)] overflow-hidden bg-[#1e1e1e]">
                        {panelTab === 'terminal' ? (
                          terminalPanelContent
                        ) : (
                          <div className="p-4 text-xs text-[#858585]">
                            {panelTab === 'output' && 'No output.'}
                            {panelTab === 'problems' && 'No problems detected.'}
                            {panelTab === 'debug' && 'Debug is not configured.'}
                          </div>
                        )}
                      </div>
                    </Panel>
                  </>
                )}
              </PanelGroup>
            </Panel>
          </PanelGroup>
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-[22px] flex items-center bg-[#007acc] px-2 text-[12px] text-white select-none justify-between z-50 relative shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 hover:bg-white/20 px-1 py-0.5 rounded cursor-pointer transition-colors">
            <GitBranch size={12} />
            <span className="font-normal text-[11px]">main*</span>
          </div>
          <div className="flex items-center gap-1 hover:bg-white/20 px-1 py-0.5 rounded cursor-pointer transition-colors">
            <RefreshCw size={12} />
            <span className="text-[11px]">0 ↓ 1 ↑</span>
          </div>
          <div className="flex items-center gap-2 hover:bg-white/20 px-1 py-0.5 rounded cursor-pointer transition-colors">
            <span className="text-[11px]">⊗ 0</span>
            <span className="text-[11px]">⚠ 0</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hover:bg-white/20 px-1 py-0.5 rounded cursor-pointer transition-colors text-[11px]">
            Ln {currentTab ? 12 : 0}, Col {currentTab ? 45 : 0}
          </div>
          <div className="hover:bg-white/20 px-1 py-0.5 rounded cursor-pointer transition-colors hidden sm:block text-[11px]">
            Spaces: 2
          </div>
          <div className="hover:bg-white/20 px-1 py-0.5 rounded cursor-pointer transition-colors hidden sm:block text-[11px]">
            UTF-8
          </div>
          <div className="hover:bg-white/20 px-1 py-0.5 rounded cursor-pointer transition-colors hidden sm:block text-[11px]">
            LF
          </div>
          <div className="hover:bg-white/20 px-1 py-0.5 rounded cursor-pointer transition-colors font-medium text-[11px]">
            {{
              'typescript': 'TypeScript JSX',
              'javascript': 'JavaScript',
              'python': 'Python',
              'html': 'HTML',
              'css': 'CSS',
              'json': 'JSON'
            }[currentTab?.language || ''] || 'Plain Text'}
          </div>
          <div className="hover:bg-white/20 px-1 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-1.5">
            {isConnected ? <div className="w-2 h-2 rounded-full bg-white/90" /> : <div className="w-2 h-2 rounded-full bg-red-400" />}
            <span className="text-[11px]">{isConnected ? `Remote` : 'Disconnected'}</span>
          </div>
          <div className="hover:bg-white/20 px-1 py-0.5 rounded cursor-pointer transition-colors">
            <span className="text-white/90 text-[11px]">Prettier</span>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          type={contextMenu.type}
          path={contextMenu.path}
          name={contextMenu.name}
          onClose={handleContextMenuClose}
          onAction={handleContextMenuAction}
          hasClipboard={!!clipboard}
        />
      )}

      {/* Create Item Modal */}
      <CreateItemModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateItem}
        defaultPath={createModalPath}
        initialType={createModalType}
      />

      <RenameItemModal
        isOpen={showRenameModal}
        onClose={() => setShowRenameModal(false)}
        onRename={handleRename}
        currentName={renameCurrentName}
      />

      <DeleteItemModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteItem}
        itemName={deleteData?.name || ''}
        itemType={deleteData?.type || 'file'}
      />
    </div>
  );
}
