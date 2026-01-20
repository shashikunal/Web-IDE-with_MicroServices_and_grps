import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface TerminalComponentProps {
  terminalId: string;
  isActive: boolean;
  visible?: boolean;
  onData: (terminalId: string, data: string) => void;
  onResize: (terminalId: string, cols: number, rows: number) => void;
  onReady?: (terminalId: string, writer: { write: (data: string) => void }) => void;
  initialData?: string;
  lastRefresh?: number;
}

export default function TerminalComponent({
  terminalId,
  isActive,
  visible = true,
  onData,
  onResize,
  onReady,
  initialData = '',
  lastRefresh
}: TerminalComponentProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  // Track if terminal has been initialized to prevent re-creation
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    if (!terminalRef.current) return;

    console.log(`[Terminal] Mounting ${terminalId}`);

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      cursorWidth: 2,
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
      theme: {
        background: '#181818',
        foreground: '#eff0eb',
        cursor: '#aeafad',
        selectionBackground: '#264f78'
      },
      convertEol: true,
      macOptionIsMeta: true,
      rightClickSelectsWord: true,
      scrollback: 1000,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    if (initialData) {
      setTimeout(() => {
        // console.log(`[Terminal] Writing initial data to ${terminalId}. Length: ${initialData.length}`);
        term.write(initialData);
      }, 100);
    }

    // Restore/Refresh logic
    if (lastRefresh && initialData) {
      term.clear();
      term.write(initialData);
    }

    term.onData((data) => {
      // Filter out Device Status Report (DSR) responses (ESC [ n ; m R)
      // This prevents garbage like ^[[5;14R from appearing on resize/focus if the shell doesn't consume it
      const filtered = data.replace(/\x1b\[\d+;\d+R/g, '');
      if (filtered) {
        onData(terminalId, filtered);
      }
    });

    if (onReady) {
      onReady(terminalId, { write: (data) => term.write(data) });
    }

    term.onResize((size) => {
      onResize(terminalId, size.cols, size.rows);
    });

    terminalInstanceRef.current = term;
    fitAddonRef.current = fitAddon;
    initializedRef.current = true;

    // Initial resize
    setTimeout(() => fitAddon.fit(), 100);

    return () => {
      console.log(`[Terminal] Unmounting/Disposing ${terminalId}`);
      term.dispose();
      terminalInstanceRef.current = null;
      fitAddonRef.current = null;
      initializedRef.current = false;
    };
    // Exclude initialData from dependencies to prevent re-mounting on data updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terminalId, onData, onResize, onReady]);

  // Handle manual refresh/restore request
  useEffect(() => {
    if (initializedRef.current && terminalInstanceRef.current && initialData && lastRefresh) {
      // console.log(`[Terminal] Refreshing/Restoring content for ${terminalId}`);
      // terminalInstanceRef.current.clear(); // Removed to prevent blanking
      terminalInstanceRef.current.write(initialData);
      // Force fit
      setTimeout(() => fitAddonRef.current?.fit(), 50);
    }
  }, [lastRefresh, initialData, terminalId]);

  // Handle resize when terminal becomes active or visible
  useEffect(() => {
    if ((isActive || visible) && fitAddonRef.current) {
      setTimeout(() => {
        try {
          fitAddonRef.current?.fit();
        } catch (e) {
          // Ignore fit errors
        }
      }, 100);
    }
  }, [isActive, visible]);

  // Auto-resize when container size changes (e.g. sidebar toggle)
  useEffect(() => {
    if (!terminalRef.current || !fitAddonRef.current) return;

    const observer = new ResizeObserver(() => {
      // Only fit if visible and has dimensions
      if (visible && terminalRef.current && terminalRef.current.clientWidth > 0) {
        requestAnimationFrame(() => {
          try {
            fitAddonRef.current?.fit();
          } catch (e) {
            // Ignore fit errors
          }
        });
      }
    });

    observer.observe(terminalRef.current);

    return () => observer.disconnect();
  }, [visible]);

  return (
    <div
      ref={terminalRef}
      style={{
        height: '100%',
        width: '100%',
        backgroundColor: '#181818',
        padding: '8px'
      }}
    />
  );
}

interface TerminalPanelProps {
  terminals: Array<{ id: string; name: string }>;
  activeTerminalId: string;
  visible?: boolean;
  onTerminalChange: (id: string) => void;
  onTerminalClose: (id: string) => void;
  onData: (terminalId: string, data: string) => void;
  onResize: (terminalId: string, cols: number, rows: number) => void;
  onTerminalReady?: (terminalId: string, writer: { write: (data: string) => void }) => void;
  onTerminalAdd?: () => void;
  initialData?: Record<string, string>;
  lastRefresh?: number;
}

export function TerminalPanel({
  terminals,
  activeTerminalId,
  visible = true,
  onTerminalChange,
  onTerminalClose,
  onTerminalAdd,
  onData,
  onResize,
  onTerminalReady,
  initialData = {},
  lastRefresh
}: TerminalPanelProps) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Terminal Tabs */}
      <div style={{
        display: 'flex',
        backgroundColor: '#2d2d30',
        borderBottom: '1px solid #3e3e42',
        minHeight: '35px'
      }}>
        {terminals.map((terminal) => (
          <div
            key={terminal.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              backgroundColor: activeTerminalId === terminal.id ? '#1e1e1e' : 'transparent',
              borderRight: '1px solid #3e3e42',
              cursor: 'pointer',
              position: 'relative'
            }}
            onClick={() => onTerminalChange(terminal.id)}
          >
            <span style={{
              fontSize: '13px',
              color: '#cccccc',
              marginRight: '8px'
            }}>
              {terminal.name}
            </span>
            {terminals.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTerminalClose(terminal.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#cccccc',
                  cursor: 'pointer',
                  padding: '2px',
                  borderRadius: '2px',
                  fontSize: '12px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#3e3e42';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}
        {onTerminalAdd && (
          <button
            onClick={onTerminalAdd}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '35px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRight: '1px solid #3e3e42',
              cursor: 'pointer',
              color: '#cccccc'
            }}
            title="New Terminal"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#3e3e42';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            +
          </button>
        )}
      </div>

      {/* Terminal Content */}
      <div style={{ flex: 1, position: 'relative' }}>
        {terminals.map((terminal) => (
          <div
            key={terminal.id}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: activeTerminalId === terminal.id ? 'block' : 'none'
            }}
          >
            <TerminalComponent
              terminalId={terminal.id}
              isActive={activeTerminalId === terminal.id}
              visible={visible}
              onData={onData}
              onResize={onResize}
              onReady={onTerminalReady}
              initialData={initialData[terminal.id]}
              lastRefresh={lastRefresh}
            />
          </div>
        ))}
      </div>
    </div>
  );
}