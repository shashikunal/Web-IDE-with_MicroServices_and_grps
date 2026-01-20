import React, { useMemo, useRef, useEffect } from 'react';
import { Tree, TreeApi } from 'react-arborist';
import type { FileItem } from '../../store/api/apiSlice';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  FileCode,
  FileJson,
  FileText,
  Image as ImageIcon,
  Settings
} from 'lucide-react';

interface FileExplorerProps {
  files: FileItem[];
  onFileSelect: (file: FileItem) => void;
  onFolderToggle: (path: string) => void;
  expandedFolders: Set<string>;
  onContextMenu: (e: React.MouseEvent, type: 'file' | 'folder' | 'background', path?: string, name?: string) => void;
  onMove?: (src: string, dest: string) => void;
  className?: string;
}

// Modern file type colors and icons
const FILE_TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  // JavaScript/TypeScript
  js: { icon: <FileCode size={16} />, color: '#f7df1e' },
  jsx: { icon: <FileCode size={16} />, color: '#61dafb' },
  ts: { icon: <FileCode size={16} />, color: '#3178c6' },
  tsx: { icon: <FileCode size={16} />, color: '#3178c6' },

  // Markup/Styles
  html: { icon: <FileCode size={16} />, color: '#e34c26' },
  css: { icon: <FileCode size={16} />, color: '#264de4' },
  scss: { icon: <FileCode size={16} />, color: '#cc6699' },

  // Config/Data
  json: { icon: <FileJson size={16} />, color: '#ffd700' },
  yaml: { icon: <Settings size={16} />, color: '#cb171e' },
  yml: { icon: <Settings size={16} />, color: '#cb171e' },

  // Documentation
  md: { icon: <FileText size={16} />, color: '#519aba' },
  txt: { icon: <FileText size={16} />, color: '#858585' },

  // Images
  png: { icon: <ImageIcon size={16} />, color: '#a074c4' },
  jpg: { icon: <ImageIcon size={16} />, color: '#a074c4' },
  jpeg: { icon: <ImageIcon size={16} />, color: '#a074c4' },
  svg: { icon: <ImageIcon size={16} />, color: '#ffb13b' },

  // Other
  py: { icon: <FileCode size={16} />, color: '#3776ab' },
  go: { icon: <FileCode size={16} />, color: '#00add8' },
  rs: { icon: <FileCode size={16} />, color: '#dea584' },
  java: { icon: <FileCode size={16} />, color: '#f89820' },

  // Default
  default: { icon: <File size={16} />, color: '#858585' }
};

function getFileIcon(name: string, type: 'file' | 'directory', isOpen?: boolean): { icon: React.ReactNode; color: string } {
  if (type === 'directory') {
    return {
      icon: isOpen ? <FolderOpen size={16} strokeWidth={1.5} /> : <Folder size={16} strokeWidth={1.5} />,
      color: isOpen ? '#dcb67a' : '#8c8c8c'
    };
  }

  const ext = name.split('.').pop()?.toLowerCase() || '';
  return FILE_TYPE_CONFIG[ext] || FILE_TYPE_CONFIG.default;
}

export default function FileExplorer({
  files,
  onFileSelect,
  onFolderToggle,
  expandedFolders,
  onContextMenu,
  onMove,
  className
}: FileExplorerProps) {
  const data = useMemo(() => {
    if (!files || files.length === 0) return [];

    const normalize = (items: FileItem[]): FileItem[] => {
      return items.map(item => ({
        ...item,
        children: item.children ? normalize(item.children) : []
      }));
    };

    const root = files[0];
    return root?.children ? normalize(root.children) : [];
  }, [files]);

  const containerRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<TreeApi<FileItem>>(null);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();

    const observer = new ResizeObserver(updateDimensions);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!treeRef.current) return;

    const timer = setTimeout(() => {
      const tree = treeRef.current;
      if (!tree) return;

      expandedFolders.forEach(path => {
        if (!tree.isOpen(path)) {
          tree.open(path);
        }
      });
    }, 50);

    return () => clearTimeout(timer);
  }, [expandedFolders, data]);

  return (
    <div
      ref={containerRef}
      className={twMerge("h-full w-full overflow-hidden bg-[var(--color-vs-sidebar)]", className)}
      onContextMenu={(e) => {
        if (e.target === e.currentTarget) {
          onContextMenu(e, 'background');
        }
      }}
    >
      {dimensions.width > 0 && dimensions.height > 0 && (
        <Tree
          ref={treeRef}
          data={data}
          idAccessor="path"
          openByDefault={false}
          width={dimensions.width}
          height={dimensions.height}
          indent={12}
          rowHeight={24}
          padding={0}
          onToggle={async (id) => {
            const tree = treeRef.current;
            if (tree) {
              const isNodeOpen = tree.isOpen(id);
              const isExpanded = expandedFolders.has(id);
              if (isNodeOpen === isExpanded) return;
            }
            onFolderToggle(id);
          }}
          onMove={async ({ dragIds, parentId, index }) => {
            if (onMove && dragIds.length > 0) {
              const src = dragIds[0];
              const fileName = src.split('/').pop();
              if (!fileName) return;

              let dest = '';
              if (parentId === null) {
                dest = fileName;
              } else {
                dest = `${parentId}/${fileName}`.replace('//', '/');
              }

              if (src !== dest) {
                onMove(src, dest);
              }
            }
          }}
          onActivate={(node) => {
            if (node.data.type !== 'directory') {
              onFileSelect(node.data);
            } else {
              node.toggle();
            }
          }}
        >
          {({ node, style, dragHandle }) => {
            const isFolder = node.data.type === 'directory';
            const { icon, color } = getFileIcon(node.data.name, node.data.type, node.isOpen);

            return (
              <div
                style={style}
                ref={dragHandle}
                className={clsx(
                  "group flex items-center px-2 cursor-pointer select-none text-[13px] font-normal",
                  "transition-all duration-150 ease-out",
                  "text-[var(--color-vs-text)]",
                  "hover:bg-[var(--color-vs-activity)]",
                  node.isSelected && "bg-[var(--color-vs-accent)] text-white font-medium",
                  node.isFocused && "ring-1 ring-inset ring-[var(--color-vs-status)]"
                )}
                draggable="true"
                onClick={() => {
                  node.select();
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onContextMenu(e, isFolder ? 'folder' : 'file', node.data.path, node.data.name);
                }}
              >
                {/* Chevron for folders */}
                <span
                  className={clsx(
                    "mr-1 w-4 h-4 flex items-center justify-center flex-shrink-0",
                    "text-[var(--color-vs-text-muted)] transition-all duration-200",
                    isFolder && "hover:text-[var(--color-vs-text)] hover:bg-white/5 rounded",
                    !isFolder && "opacity-0"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isFolder) node.toggle();
                  }}
                >
                  {isFolder && (
                    <span className={clsx("transition-transform duration-200", node.isOpen && "rotate-90")}>
                      <ChevronRight size={14} strokeWidth={2} />
                    </span>
                  )}
                </span>

                {/* File/Folder Icon */}
                <span
                  className="mr-2 flex items-center justify-center w-4 h-4 flex-shrink-0 transition-all duration-200"
                  style={{ color: node.isSelected ? 'currentColor' : color }}
                >
                  {icon}
                </span>

                {/* File/Folder Name */}
                <span className={clsx(
                  "truncate flex-1 tracking-tight",
                  node.isSelected ? "font-medium" : "font-normal opacity-90"
                )}>
                  {node.data.name}
                </span>

                {/* Hover indicator */}
                {!node.isSelected && (
                  <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="w-1 h-1 rounded-full bg-[var(--color-vs-status)]" />
                  </span>
                )}
              </div>
            );
          }}
        </Tree>
      )}
    </div>
  );
}