import React, { useEffect, useRef } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';

interface DeleteItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemName: string;
    itemType: 'file' | 'folder';
}

export default function DeleteItemModal({
    isOpen,
    onClose,
    onConfirm,
    itemName,
    itemType
}: DeleteItemModalProps) {
    const confirmBtnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => confirmBtnRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
        if (e.key === 'Enter') {
            onConfirm();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2000,
                backdropFilter: 'blur(4px)'
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            onKeyDown={handleKeyDown}
        >
            <div style={{
                backgroundColor: '#1e1e2e',
                borderRadius: '12px',
                padding: '24px',
                width: '100%',
                maxWidth: '400px',
                border: '1px solid #313244',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '20px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(243, 139, 168, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Trash2 size={22} color="#f38ba8" />
                        </div>
                        <div>
                            <h2 style={{
                                color: '#cdd6f4',
                                margin: 0,
                                fontSize: '18px',
                                fontWeight: 600
                            }}>
                                Delete {itemType === 'folder' ? 'Folder' : 'File'}?
                            </h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#6c7086',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '8px',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#313244'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ marginBottom: '24px' }}>
                    <p style={{ color: '#a6adc8', fontSize: '14px', lineHeight: '1.5' }}>
                        Are you sure you want to delete <span style={{ color: '#cdd6f4', fontWeight: 600 }}>{itemName}</span>?
                    </p>
                    <div style={{
                        marginTop: '12px',
                        padding: '12px',
                        backgroundColor: 'rgba(243, 139, 168, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid rgba(243, 139, 168, 0.2)',
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'start'
                    }}>
                        <AlertTriangle size={16} color="#f38ba8" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span style={{ color: '#f38ba8', fontSize: '13px' }}>
                            This action cannot be undone.
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#313244',
                            color: '#cdd6f4',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 500,
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45475a'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#313244'}
                    >
                        Cancel
                    </button>
                    <button
                        ref={confirmBtnRef}
                        type="button"
                        onClick={onConfirm}
                        style={{
                            padding: '10px 24px',
                            backgroundColor: '#f38ba8',
                            color: '#1e1e2e',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 600,
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eba0ac'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f38ba8'}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}
