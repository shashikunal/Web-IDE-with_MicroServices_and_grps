import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Edit2, AlertCircle } from 'lucide-react';

interface RenameItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRename: (newName: string) => void;
    currentName: string;
}

export default function RenameItemModal({
    isOpen,
    onClose,
    onRename,
    currentName
}: RenameItemModalProps) {
    const [name, setName] = useState(currentName);
    const [error, setError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const resetForm = useCallback(() => {
        setName(currentName);
        setError('');
    }, [currentName]);

    useEffect(() => {
        if (isOpen) {
            resetForm();
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.select();
                }
            }, 100);
        }
    }, [isOpen, resetForm]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            setError('Name is required');
            return;
        }

        if (name === currentName) {
            onClose();
            return;
        }

        // eslint-disable-next-line no-control-regex
        const invalidChars = /[<>:"/\\|?*\x00-\x1f]/g;
        if (invalidChars.test(name)) {
            setError('Name contains invalid characters');
            return;
        }

        if (name.startsWith('.')) {
            // Allow dotfiles reuse logic or just warn? VSCode allows it.
            // Keeping check just in case but maybe relax it?
            // setError('Name cannot start with a dot');
            // return; 
        }

        if (name.length > 255) {
            setError('Name is too long');
            return;
        }

        onRename(name.trim());
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
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
                maxWidth: '420px',
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
                            backgroundColor: '#89b4fa',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Edit2 size={22} color="#1e1e2e" />
                        </div>
                        <div>
                            <h2 style={{
                                color: '#cdd6f4',
                                margin: 0,
                                fontSize: '18px',
                                fontWeight: 600
                            }}>
                                Rename Item
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

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '16px' }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError('');
                            }}
                            autoComplete="off"
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                backgroundColor: '#313244',
                                border: error ? '1px solid #f38ba8' : '1px solid #45475a',
                                borderRadius: '8px',
                                color: '#cdd6f4',
                                fontSize: '15px',
                                outline: 'none',
                                transition: 'all 0.2s'
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#89b4fa';
                                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(137, 180, 250, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = error ? '#f38ba8' : '#45475a';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        />
                        {error && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginTop: '8px',
                                color: '#f38ba8',
                                fontSize: '13px'
                            }}>
                                <AlertCircle size={14} />
                                {error}
                            </div>
                        )}
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
                            type="submit"
                            disabled={!name.trim()}
                            style={{
                                padding: '10px 24px',
                                backgroundColor: name.trim() ? '#89b4fa' : '#313244',
                                color: name.trim() ? '#1e1e2e' : '#6c7086',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: name.trim() ? 'pointer' : 'not-allowed',
                                fontSize: '14px',
                                fontWeight: 600,
                                transition: 'all 0.2s'
                            }}
                        >
                            Rename
                        </button>
                    </div>
                </form>

                {/* Keyboard Hints */}
                <div style={{
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid #313244',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '16px'
                }}>
                    <span style={{ color: '#6c7086', fontSize: '12px' }}>
                        <kbd style={{
                            backgroundColor: '#313244',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            marginRight: '4px'
                        }}>Enter</kbd> to confirm
                    </span>
                    <span style={{ color: '#6c7086', fontSize: '12px' }}>
                        <kbd style={{
                            backgroundColor: '#313244',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            marginRight: '4px'
                        }}>Esc</kbd> to cancel
                    </span>
                </div>
            </div>
        </div>
    );
}
