import React, { useMemo, useRef, useEffect } from 'react';
import { Tree, TreeApi } from 'react-arborist';
import type { FileItem } from '../../store/api/apiSlice';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';

interface FileExplorerProps {
  files: FileItem[];
  onFileSelect: (file: FileItem) => void;
  onFolderToggle: (path: string) => void;
  expandedFolders: Set<string>;
  onContextMenu: (e: React.MouseEvent, type: 'file' | 'folder' | 'background', path?: string, name?: string) => void;
  onMove?: (src: string, dest: string) => void;
  className?: string;
}

const FILE_ICONS: Record<string, string> = {
  js: '📄', ts: '📘', jsx: '⚛️', tsx: '⚛️', json: '📋', md: '📝',
  html: '🌐', css: '🎨', py: '🐍', go: '🔵', cpp: '🟣', rs: '🦀',
  java: '☕', sh: '💻', dockerfile: '🐳', yaml: '⚙️', yml: '⚙️',
  default: '📄', folder: '📁', folderOpen: '📂'
};

function getFileIcon(name: string, type: 'file' | 'directory', isOpen?: boolean): React.ReactNode {
  // We can stick to emojis for file types as they are colorful, or switch to Lucide if we had a full map.
  // For 'perfect' aesthetics, consistent icon sets are better, but emojis are a quick win for variety.
  // Let's keep emojis for files but ensure folders look good.

  if (type === 'directory') {
    return isOpen ?
      <FolderOpen size={16} className="text-[#a8a8a8]" strokeWidth={1.5} /> :
      <Folder size={16} className="text-[#a8a8a8]" strokeWidth={1.5} />;
  }

  const ext = name.split('.').pop()?.toLowerCase() || '';
  // Special case for some icons using Lucide if desired, otherwise fallback to emoji map
  if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) return <span className="text-sm">⚡</span>;
  if (['css', 'html'].includes(ext)) return <span className="text-sm">🌐</span>;

  return <span className="text-sm opacity-80">{FILE_ICONS[ext] || FILE_ICONS.default}</span>;
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

    // Recursive function to ensure children property exists
    const normalize = (items: FileItem[]): FileItem[] => {
      return items.map(item => ({
        ...item,
        children: item.children ? normalize(item.children) : []
      }));
    };

    const root = files[0];
    // Return normalized children of root
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

  // Sync expanded folders state with tree
  useEffect(() => {
    if (!treeRef.current) return;

    // Slight delay to ensure tree has reconciled data
    const timer = setTimeout(() => {
      const tree = treeRef.current;
      if (!tree) return;

      expandedFolders.forEach(path => {
        // Only attempt to open if it's not already open
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
      className={twMerge("h-full w-full overflow-hidden bg-[#252526]", className)}
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
          indent={10}
          rowHeight={22}
          padding={0}
          onToggle={async (id) => {
            const tree = treeRef.current;
            if (tree) {
              const isNodeOpen = tree.isOpen(id);
              const isExpanded = expandedFolders.has(id);
              // If tree state matches expanded state, this toggle was likely
              // caused by our sync effect (programmatic open), so ignore it
              // to prevent toggling it back (collapsing).
              if (isNodeOpen === isExpanded) return;
            }
            onFolderToggle(id);
          }}
          onMove={async ({ dragIds, parentId, index }) => {
            if (onMove && dragIds.length > 0) {
              const src = dragIds[0]; // The ID is the full path
              // Calculate destination path
              // parentId is the path of the destination folder (or null? No, arborist uses null for root usually if dataset is flat, but here it's nested)
              // If parentId is null, it means top level of 'data', which means direct child of 'root' (files[0]).
              // But 'root' path is typically empty string or '.'.
              // Let's assume parentId is the path of the folder.
              // If we drop at top level, parentId might be null.

              const fileName = src.split('/').pop();
              if (!fileName) return;

              let dest = '';
              if (parentId === null) {
                // Moved to root (of the view, which is root folder)
                dest = fileName;
              } else {
                // parentId is the path of the target folder
                // If parentId has trailing slash, remove it?
                // Paths seem to not have trailing slashes based on fileController.
                // But let's handle ensuring separator.
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
            const icon = getFileIcon(node.data.name, node.data.type, node.isOpen);

            return (
              <div
                style={style}
                ref={dragHandle}
                className={clsx(
                  "flex items-center px-6 cursor-pointer select-none text-[13px] transition-colors",
                  "text-[#cccccc] hover:bg-[#2a2d2e]",
                  node.isSelected && "bg-[#37373d] text-white",
                  node.isFocused && "outline outline-1 outline-[#007acc] -outline-offset-1"
                )}
                draggable="true"
                onClick={() => {
                  node.select();
                  // If directory, toggle is handled by onActivate or explicit click on arrow
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onContextMenu(e, isFolder ? 'folder' : 'file', node.data.path, node.data.name);
                }}
              >
                <span
                  className="mr-2 w-4 flex justify-center text-[#cccccc] hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isFolder) node.toggle();
                  }}
                >
                  {isFolder && (
                    node.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                  )}
                </span>
                <span className="mr-2 flex items-center justify-center w-4">{icon}</span>
                <span className="truncate flex-1 font-normal opacity-90">{node.data.name}</span>
              </div>
            );
          }}
        </Tree>
      )}
    </div>
  );
}