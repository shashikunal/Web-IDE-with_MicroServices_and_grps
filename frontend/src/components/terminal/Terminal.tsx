import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { Plus, X } from 'lucide-react';
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

const WELCOME_MESSAGE = [
  '\r\n\x1b[38;5;39m  Welcome to Antigravity IDE \x1b[0m',
  '\x1b[38;5;238m  ----------------------------------------\x1b[0m',
  '\x1b[38;5;244m  • Environment: \x1b[38;5;255mNode.js / Docker\x1b[0m',
  '\x1b[38;5;244m  • Status:      \x1b[38;5;42mOnline\x1b[0m',
  '\r\n'
].join('\r\n');

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

    // console.log(`[Terminal] Mounting ${terminalId}`);

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      cursorWidth: 2,
      fontSize: 14, // Slightly larger font
      fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
      theme: {
        background: '#181818',
        foreground: '#cccccc',
        cursor: '#3b82f6', // Bright blue cursor
        selectionBackground: '#264f78',
        black: '#000000',
        red: '#e06c75',
        green: '#98c379',
        yellow: '#e5c07b',
        blue: '#61afef',
        magenta: '#c678dd',
        cyan: '#56b6c2',
        white: '#abb2bf',
        brightBlack: '#5c6370',
        brightRed: '#e06c75',
        brightGreen: '#98c379',
        brightYellow: '#e5c07b',
        brightBlue: '#61afef',
        brightMagenta: '#c678dd',
        brightCyan: '#56b6c2',
        brightWhite: '#ffffff',
      },
      convertEol: true,
      macOptionIsMeta: true,
      rightClickSelectsWord: true,
      scrollback: 2000,
      allowProposedApi: true
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    // Write welcome message immediately if new session
    if (!initialData) {
      term.write(WELCOME_MESSAGE);
    } else {
      setTimeout(() => {
        term.write(initialData);
      }, 50);
    }

    // Restore/Refresh logic
    if (lastRefresh && initialData) {
      term.clear();
      term.write(initialData);
    }

    term.onData((data) => {
      // Filter out Device Status Report (DSR) responses (ESC [ n ; m R)
      // This prevents garbage like ^[[5;14R from appearing on resize/focus if the shell doesn't consume it
      // eslint-disable-next-line no-control-regex
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
      // console.log(`[Terminal] Unmounting/Disposing ${terminalId}`);
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
} catch {
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
} catch {
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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', backgroundColor: '#1e1e1e' }}>
      {/* Terminal Tabs Header */}
      <div style={{
        display: 'flex',
        backgroundColor: '#252526', // VS Code Panel Background
        borderBottom: 'none',
        minHeight: '35px',
        paddingLeft: '0px'
      }}>
        {terminals.map((terminal) => {
          const isActive = activeTerminalId === terminal.id;
          return (
            <div
              key={terminal.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 10px',
                backgroundColor: isActive ? '#1e1e1e' : 'transparent', // Active matches editor bg
                borderTop: isActive ? '1px solid #007fd4' : '1px solid transparent', // VS Code Active Tab Border
                borderRight: '1px solid #252526',
                cursor: 'pointer',
                color: isActive ? '#ffffff' : '#969696',
                fontSize: '11px',
                textTransform: 'uppercase',
                fontWeight: isActive ? 600 : 400,
                height: '35px',
                position: 'relative',
                minWidth: '120px',
                maxWidth: '200px'
              }}
              onClick={() => onTerminalChange(terminal.id)}
              className="group"
            >
              <span style={{
                marginRight: 'auto',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
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
                    color: 'inherit',
                    cursor: 'pointer',
                    padding: '2px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: '6px',
                    opacity: isActive ? 1 : 0, // Only show close on active or hover (via group-hover logic if strictly css, here simplified)
                  }}
                  className="hover:bg-[#3fb950] hover:text-white" // Green fix? no, standard gray hover
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#424242'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          );
        })}
        {onTerminalAdd && (
          <button
            onClick={onTerminalAdd}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '35px',
              height: '35px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#c5c5c5'
            }}
            title="New Terminal"
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#c5c5c5'; }}
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      {/* Terminal Content */}
      <div style={{ flex: 1, position: 'relative', backgroundColor: '#1e1e1e' }}>
        {terminals.map((terminal) => (
          <div
            key={terminal.id}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: activeTerminalId === terminal.id ? 'block' : 'none',
              padding: '4px 0 0 12px' // Padding for terminal content
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