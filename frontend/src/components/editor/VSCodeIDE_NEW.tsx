import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import * as Tabs from '@radix-ui/react-tabs';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import {
  X,
  File,
  Folder,
  Plus,
  RefreshCw,
  Maximize2,
  Minimize2,
  Zap,
  Files,
  Search,
  GitBranch,
  Bug,
  Settings
} from 'lucide-react';
import { useGetFileTreeQuery, useSaveFileMutation, useCreateFileMutation, useCreateDirectoryMutation, useDeleteFileMutation, useMoveFileMutation, useCopyFileMutation } from '../../store/api/apiSlice';
import type { Template, FileItem } from '../../store/api/apiSlice';
import FileExplorer from '../file-explorer/FileExplorer';
import Editor from '@monaco-editor/react';
import { configureMonaco } from './editorConfig';
import { TerminalPanel } from '../terminal/Terminal';
import Preview from '../editor/Preview';
import ContextMenu from '../context-menu/ContextMenu';
import CreateItemModal from './CreateItemModal';
import RenameItemModal from './RenameItemModal';
import DeleteItemModal from './DeleteItemModal';
import ApiTestPanel from '../api-test/ApiTestPanel';

// Extracted components
import TitleBar from './TitleBar';
import MenuBar from './MenuBar';
import ActivityBar from './ActivityBar';
import StatusBar from './StatusBar';

// Custom hooks
import { useTerminalWebSocket } from './hooks/useTerminalWebSocket';

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

const ACTIVITY_BAR_ITEMS = [
  { id: 'explorer', icon: Files, label: 'Explorer' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'git', icon: GitBranch, label: 'Source Control' },
  { id: 'debug', icon: Bug, label: 'Run and Debug' },
  { id: 'extensions', icon: Settings, label: 'Extensions' },
  { id: 'api-test', icon: Zap, label: 'API Tester' },
];

export default function VSCodeIDE({ template, userId, workspaceId, containerId, publicPort, setAppState }: VSCodeIDEProps) {
  const navigate = useNavigate();

  // UI State
  const [activeActivity, setActiveActivity] = useState('explorer');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [username, setUsername] = useState('User');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showPanel, setShowPanel] = useState(true);
  const [showPreview, setShowPreview] = useState(template.hasPreview);
  const [isExplorerCollapsed, setIsExplorerCollapsed] = useState(false);

  // Editor State
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['']));

  // Terminal State
  const [terminals, setTerminals] = useState<Terminal[]>([
    { id: 'main', name: 'Terminal', isActive: true }
  ]);
  const [activeTerminalId, setActiveTerminalId] = useState<string>('main');
  const [isConnected, setIsConnected] = useState(false);

  // Context Menu State
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

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalType, setCreateModalType] = useState<'file' | 'folder'>('file');
  const [createModalPath, setCreateModalPath] = useState('/');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renamePath, setRenamePath] = useState('');
  const [renameCurrentName, setRenameCurrentName] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteData, setDeleteData] = useState<{ path: string; name: string; type: 'file' | 'folder' } | null>(null);

  // File Tree State
  const [fileTree, setFileTree] = useState<FileItem | null>(null);
  const { data: initialTree, refetch: refetchFileTree } = useGetFileTreeQuery({ userId, workspaceId }, { skip: !userId || !workspaceId });

  // API Mutations
  const [saveFile] = useSaveFileMutation();
  const [createFileMutation] = useCreateFileMutation();
  const [createDirectory] = useCreateDirectoryMutation();
  const [deleteFile] = useDeleteFileMutation();
  const [moveFile] = useMoveFileMutation();
  const [copyFile] = useCopyFileMutation();

  // Terminal Refresh State
  const [lastTerminalRefresh, setLastTerminalRefresh] = useState(0);

  // Refs
  const autoSaveTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Custom Hooks
  const terminalOps = useTerminalWebSocket({
    userId,
    containerId,
    terminals,
    templateId: template.id,
    templateName: template.name,
    publicPort,
    onConnectionChange: setIsConnected
  });



  // Derived State
  const currentTab = tabs.find(t => t.id === activeTab);


  // Username Effect
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
    window.addEventListener('storage', updateUsername);
    return () => window.removeEventListener('storage', updateUsername);
  }, [userId]);

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setAppState('templates');
  };

  // Terminal Refresh Effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setLastTerminalRefresh(Date.now());
    }, 100);
    return () => clearTimeout(timer);
  }, [activeActivity, showSidebar, isExplorerCollapsed, showPanel, showPreview]);

  // Preview Effect
  useEffect(() => {
    if (template.hasPreview && !showPreview) setShowPreview(true);
  }, [template.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // File Tree Effects
  useEffect(() => {
    if (initialTree) {
      setFileTree(initialTree);
    }
  }, [initialTree]);



  // File Tree Helpers
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
      const queryPath = normalizedPath || '/';
      const response = await fetch(`/api/workspaces/${workspaceId}/files?path=${encodeURIComponent(queryPath)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const items = (data.files || []).map((item: FileItem) => ({
          ...item,
          children: item.children || []
        }));
        updateFolderChildren(path, items);
      }
    } catch (err) {
      console.error('Failed to fetch folder:', err);
    }
  }, [workspaceId, updateFolderChildren]);

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

      setTimeout(() => fetchFolderContent(path), 0);
      return new Set([...prev, path]);
    });
  }, [fetchFolderContent]);

  useEffect(() => {
    if (fileTree && fileTree.children && fileTree.children.length > 0) {
      handleFolderToggle('');
    }
  }, [fileTree, handleFolderToggle]);

  // Menu Actions


  // Context Menu Actions
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
    } catch (err: unknown) {
      const error = err as { data?: { error?: string } };
      toast.error(error?.data?.error || 'Failed to move file');
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
    } catch (err: unknown) {
      const error = err as { data?: { message?: string, error?: string } };
      console.error('Rename failed:', error);
      toast.error(error?.data?.message || error?.data?.error || 'Failed to rename');
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
    } catch {
      toast.error('Failed to delete');
    }
  };

  function addItemToTree(parentPath: string, item: FileItem, allowDuplicates = true) {
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
  }

  function deleteItemFromTree(path: string) {
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
  }

  // Terminal Functions
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

  // File Operations
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
  }, [workspaceId, tabs]);

  const handleContentChange = (tabId: string, content: string) => {
    setTabs(prev => prev.map(tab =>
      tab.id === tabId ? { ...tab, content, modified: true } : tab
    ));

    const existingTimeout = autoSaveTimeoutsRef.current.get(tabId);
    if (existingTimeout) clearTimeout(existingTimeout);

    const timeout = setTimeout(async () => {
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

  const handleSave = useCallback(async (tabId: string) => {
    const existingTimeout = autoSaveTimeoutsRef.current.get(tabId);
    if (existingTimeout) clearTimeout(existingTimeout);

    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;

    try {
      await saveFile({ userId, workspaceId, path: tab.path, content: tab.content }).unwrap();
      setTabs(prev => prev.map(t => t.id === tabId ? { ...t, modified: false } : t));
      toast.success('File saved');
    } catch {
      toast.error(`Failed to save: ${tab.name}`);
    }
  }, [tabs, userId, workspaceId, saveFile]);

  const closeTab = useCallback((id: string) => {
    const index = tabs.findIndex(t => t.id === id);
    const newTabs = tabs.filter(t => t.id !== id);
    if (activeTab === id && newTabs.length > 0) {
      setActiveTab(newTabs[Math.max(0, index - 1)].id);
    }
    setTabs(newTabs);
  }, [tabs, activeTab]);

  const handleTabClose = useCallback((id: string) => {
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
  }, [tabs, handleSave, closeTab]);

  const handleExit = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  const handleContextMenu = (e: React.MouseEvent, type: 'file' | 'folder' | 'background', path?: string, name?: string) => {
    e.preventDefault();
    setActiveMenu(null);
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, type, path, name });
  };

  const handleContextMenuClose = () => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

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
  }, [activeTab, tabs, userId, saveFile, addTerminal, handleExit, handleSave, handleTabClose, workspaceId]);

  // Terminal Panel Memoization
  const terminalPanelContent = useMemo(() => (
    <TerminalPanel
      terminals={terminals}
      activeTerminalId={activeTerminalId}
      visible={showPanel}
      onTerminalChange={switchTerminal}
      onTerminalClose={closeTerminal}
      onTerminalAdd={addTerminal}
      onData={terminalOps.handleTerminalData}
      onResize={terminalOps.handleTerminalResize}
      onTerminalReady={terminalOps.handleTerminalReady}
      initialData={terminalOps.terminalHistoryRef.current}
      lastRefresh={lastTerminalRefresh}
    />
  ), [terminals, activeTerminalId, showPanel, switchTerminal, closeTerminal, addTerminal, terminalOps.handleTerminalData, terminalOps.handleTerminalResize, terminalOps.handleTerminalReady, lastTerminalRefresh, terminalOps.terminalHistoryRef]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#1e1e1e] text-[#cccccc] overflow-hidden font-sans">


      {/* Title Bar - Extracted Component */}
      <TitleBar
        templateName={template.name}
        username={username}
        showProfileMenu={showProfileMenu}
        onToggleProfileMenu={() => setShowProfileMenu(!showProfileMenu)}
        onSave={() => handleMenuAction('save')}
        onLogout={handleLogout}
      />

      {/* Menu Bar - Extracted Component */}
      <MenuBar
        menus={MENU_ITEMS}
        activeMenu={activeMenu}
        onMenuClick={(label) => setActiveMenu(activeMenu === label ? null : label)}
        onMenuItemClick={handleMenuAction}
        onClose={() => setActiveMenu(null)}
      />

      {activeMenu && <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />}

      {/* Main Layout (Resizable Panels) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Activity Bar - Extracted Component */}
        <ActivityBar
          items={ACTIVITY_BAR_ITEMS}
          activeActivity={activeActivity}
          onActivityChange={(id) => {
            setActiveActivity(id);
            if (!showSidebar) setShowSidebar(true);
          }}
          onProfileClick={() => setShowProfileMenu(prev => !prev)}
        />

        {/* Sidebar */}
        {showSidebar && (
          <div className="w-[260px] flex flex-col bg-[#252526] border-r border-[#2b2b2b]">
            <div className="h-9 flex items-center justify-between px-4 border-b border-[#2b2b2b]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#cccccc]">
                {activeActivity === 'explorer' && 'Explorer'}
                {activeActivity === 'search' && 'Search'}
                {activeActivity === 'git' && 'Source Control'}
                {activeActivity === 'debug' && 'Run and Debug'}
                {activeActivity === 'extensions' && 'Extensions'}
                {activeActivity === 'api-test' && 'API Tester'}
              </span>
              <div className="flex gap-1">
                {activeActivity === 'explorer' && (
                  <>
                    <button
                      onClick={() => {
                        setCreateModalType('file');
                        setCreateModalPath('/');
                        setShowCreateModal(true);
                      }}
                      className="p-1 hover:bg-[#3d3d3d] rounded transition-colors"
                      title="New File"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setCreateModalType('folder');
                        setCreateModalPath('/');
                        setShowCreateModal(true);
                      }}
                      className="p-1 hover:bg-[#3d3d3d] rounded transition-colors"
                      title="New Folder"
                    >
                      <Folder size={14} />
                    </button>
                    <button
                      onClick={handleRefreshExplorer}
                      className="p-1 hover:bg-[#3d3d3d] rounded transition-colors"
                      title="Refresh Explorer"
                    >
                      <RefreshCw size={14} />
                    </button>
                    <button
                      onClick={() => setIsExplorerCollapsed(!isExplorerCollapsed)}
                      className="p-1 hover:bg-[#3d3d3d] rounded transition-colors"
                      title={isExplorerCollapsed ? "Expand All" : "Collapse All"}
                    >
                      {isExplorerCollapsed ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {activeActivity === 'explorer' && fileTree && (
                <FileExplorer
                  files={fileTree.children || []}
                  onFileSelect={openFile}
                  onFolderToggle={handleFolderToggle}
                  expandedFolders={expandedFolders}
                  onContextMenu={handleContextMenu}
                  onMove={handleMoveFile}
                />
              )}
              {activeActivity === 'api-test' && (
                <ApiTestPanel />
              )}
            </div>
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <PanelGroup direction="vertical">
            <Panel defaultSize={70} minSize={30}>
              <PanelGroup direction="horizontal">
                <Panel defaultSize={showPreview ? 50 : 100} minSize={30}>
                  <div className="h-full flex flex-col bg-[#1e1e1e]">
                    {/* Editor Tabs */}
                    {tabs.length > 0 && (
                      <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                        <div className="h-9 flex items-center bg-[#252526] border-b border-[#2b2b2b] overflow-x-auto">
                          <Tabs.List className="flex items-center h-full">
                            {tabs.map(tab => (
                              <Tabs.Trigger
                                key={tab.id}
                                value={tab.id}
                                className="group h-full px-3 flex items-center gap-2 text-[13px] border-r border-[#2b2b2b] hover:bg-[#2a2d2e] data-[state=active]:bg-[#1e1e1e] data-[state=active]:text-white transition-colors relative"
                              >
                                <File size={14} className="text-[#858585]" />
                                <span className={tab.modified ? 'italic' : ''}>{tab.name}</span>
                                {tab.modified && <span className="text-[#007acc] text-xs">●</span>}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTabClose(tab.id);
                                  }}
                                  className="ml-1 opacity-0 group-hover:opacity-100 hover:bg-[#3d3d3d] rounded p-0.5 transition-opacity"
                                >
                                  <X size={12} />
                                </button>
                              </Tabs.Trigger>
                            ))}
                          </Tabs.List>
                        </div>

                        {tabs.map(tab => (
                          <Tabs.Content key={tab.id} value={tab.id} className="flex-1 overflow-hidden">
                            <Editor
                              height="100%"
                              language={tab.language}
                              value={tab.content}
                              path={tab.path}
                              onChange={(value) => handleContentChange(tab.id, value || '')}
                              beforeMount={configureMonaco}
                              theme="vs-dark"
                              options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                lineNumbers: 'on',
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                tabSize: 2,
                                wordWrap: 'on',
                                renderValidationDecorations: 'off'
                              }}
                            />
                          </Tabs.Content>
                        ))}
                      </Tabs.Root>
                    )}

                    {tabs.length === 0 && (
                      <div className="flex-1 flex items-center justify-center text-[#858585]">
                        <div className="text-center">
                          <File size={48} className="mx-auto mb-4 opacity-50" />
                          <p className="text-sm">No file open</p>
                          <p className="text-xs mt-2">Select a file from the explorer to start editing</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Panel>

                {showPreview && template.hasPreview && (
                  <>
                    <PanelResizeHandle className="w-1 bg-[#2b2b2b] hover:bg-[#007acc] transition-colors" />
                    <Panel defaultSize={50} minSize={30}>
                      <Preview
                        url={publicPort ? `http://localhost:${publicPort}` : ''}
                        visible={showPreview}
                      />
                    </Panel>
                  </>
                )}
              </PanelGroup>
            </Panel>

            {showPanel && (
              <>
                <PanelResizeHandle className="h-1 bg-[#2b2b2b] hover:bg-[#007acc] transition-colors" />
                <Panel defaultSize={30} minSize={15}>
                  {terminalPanelContent}
                </Panel>
              </>
            )}
          </PanelGroup>
        </div>
      </div>

      {/* Status Bar - Extracted Component */}
      <StatusBar
        currentTab={currentTab}
        isConnected={isConnected}
      />

      {/* Context Menu */}
      {contextMenu.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          type={contextMenu.type}
          onClose={handleContextMenuClose}
          onAction={handleContextMenuAction}
          path={contextMenu.path}
          hasClipboard={!!clipboard}
        />
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateItemModal
          isOpen={showCreateModal}
          initialType={createModalType}
          defaultPath={createModalPath}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateItem}
        />
      )}

      {showRenameModal && (
        <RenameItemModal
          isOpen={showRenameModal}
          currentName={renameCurrentName}
          onClose={() => setShowRenameModal(false)}
          onRename={handleRename}
        />
      )}

      {showDeleteModal && deleteData && (
        <DeleteItemModal
          isOpen={showDeleteModal}
          itemName={deleteData.name}
          itemType={deleteData.type}
          onClose={() => {
            setShowDeleteModal(false);
            setDeleteData(null);
          }}
          onConfirm={handleDeleteItem}
        />
      )}
    </div>
  );
}
