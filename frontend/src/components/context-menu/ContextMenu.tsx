import React, { useEffect, useRef } from 'react';

interface ContextMenuProps {
    x: number;
    y: number;
    type: 'file' | 'folder' | 'background';
    path?: string;
    name?: string;
    onClose: () => void;
    onAction: (action: string, path?: string) => void;
    hasClipboard?: boolean;
}

interface MenuItem {
    label: string;
    icon: string;
    action: string;
    separator?: boolean;
    disabled?: boolean;
    shortcut?: string;
}

export default function ContextMenu({
    x,
    y,
    type,
    path,
    name,
    onClose,
    onAction,
    hasClipboard = false
}: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Close on escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    const getMenuItems = (): MenuItem[] => {
        if (type === 'file') {
            return [
                { label: 'New File', icon: '📄', action: 'newFile', shortcut: '' },
                { label: 'New Folder', icon: '📁', action: 'newFolder', shortcut: '' },
                { label: '', icon: '', action: '', separator: true },
                { label: 'Open to the Side', icon: '↔️', action: 'openSide' },
                { label: '', icon: '', action: '', separator: true },
                { label: 'Copy', icon: '📋', action: 'copy', shortcut: 'Ctrl+C' },
                { label: 'Copy Path', icon: '📄', action: 'copyPath', shortcut: 'Shift+Alt+C' },
                { label: '', icon: '', action: '', separator: true },
                { label: 'Rename', icon: '✏️', action: 'rename', shortcut: 'F2' },
                { label: 'Delete', icon: '🗑️', action: 'delete', shortcut: 'Del' },
            ];
        }

        if (type === 'folder') {
            return [
                { label: 'New File', icon: '📄', action: 'newFile' },
                { label: 'New Folder', icon: '📁', action: 'newFolder' },
                { label: '', icon: '', action: '', separator: true },
                { label: 'Open to the Side', icon: '↔️', action: 'openSide' },
                { label: 'Find in Folder', icon: '🔍', action: 'findInFolder' },
                { label: '', icon: '', action: '', separator: true },
                { label: 'Copy', icon: '📋', action: 'copy' },
                { label: 'Copy Path', icon: '📄', action: 'copyPath' },
                { label: 'Paste', icon: '📌', action: 'paste', disabled: !hasClipboard },
                { label: '', icon: '', action: '', separator: true },
                { label: 'Rename', icon: '✏️', action: 'rename', shortcut: 'F2' },
                { label: 'Delete', icon: '🗑️', action: 'delete', shortcut: 'Del' },
            ];
        }

        // background
        return [
            { label: 'New File', icon: '📄', action: 'newFile', shortcut: '' },
            { label: 'New Folder', icon: '📁', action: 'newFolder', shortcut: '' },
            { label: '', icon: '', action: '', separator: true },
            { label: 'Paste', icon: '📌', action: 'paste', disabled: !hasClipboard, shortcut: 'Ctrl+V' },
            { label: '', icon: '', action: '', separator: true },
            { label: 'Collapse All Folders', icon: '📂', action: 'collapseAll' },
        ];
    };

    const menuItems = getMenuItems();

    // Adjust position if menu would go off screen
    const menuWidth = 220;
    const menuHeight = menuItems.length * 24 + 20;
    const adjustedX = Math.min(x, window.innerWidth - menuWidth);
    const adjustedY = Math.min(y, window.innerHeight - menuHeight);

    return (
        <div
            ref={menuRef}
            style={{
                position: 'fixed',
                left: adjustedX,
                top: adjustedY,
                backgroundColor: '#1e1e2e',
                border: '1px solid #313244',
                borderRadius: '8px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                zIndex: 10000,
                minWidth: '200px',
                padding: '4px 0',
                fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
        >
            {menuItems.map((item, i) => {
                if (item.separator) {
                    return (
                        <div
                            key={i}
                            style={{
                                height: '1px',
                                background: '#313244',
                                margin: '4px 8px'
                            }}
                        />
                    );
                }

                return (
                    <div
                        key={i}
                        onClick={() => {
                            if (!item.disabled) {
                                onAction(item.action, path);
                            }
                        }}
                        onMouseEnter={(e) => {
                            if (!item.disabled) {
                                e.currentTarget.style.background = '#313244';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                        }}
                        style={{
                            padding: '6px 12px',
                            cursor: item.disabled ? 'not-allowed' : 'pointer',
                            fontSize: '13px',
                            color: item.disabled ? '#585b70' : '#cdd6f4',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            userSelect: 'none',
                            opacity: item.disabled ? 0.5 : 1
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ width: '18px', textAlign: 'center', fontSize: '14px' }}>{item.icon}</span>
                            <span>{item.label}</span>
                        </div>
                        {item.shortcut && (
                            <span style={{ fontSize: '11px', color: '#6c7086' }}>{item.shortcut}</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
