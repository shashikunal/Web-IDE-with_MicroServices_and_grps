import React, { useState, useCallback } from 'react';
import TerminalComponent from '../terminal/Terminal';
import { Play, Zap, Loader2, Package } from 'lucide-react';
import { executeCode, isWasmSupported, type ExecutionResult } from '../../utils/wasm';
import PackageManagerHub from '../packages/PackageManagerHub';

interface ConsoleRunnerProps {
    terminalId: string;
    onRun: () => void;
    language?: string;
    code?: string;
    useWasm?: boolean;
    onExecutionComplete?: (result: ExecutionResult) => void;
    // Terminal props
    onData: (terminalId: string, data: string) => void;
    onResize: (terminalId: string, cols: number, rows: number) => void;
    onReady?: (terminalId: string, writer: { write: (data: string) => void }) => void;
    initialData?: string;
}

export default function ConsoleRunner({
    terminalId,
    onRun,
    language = 'javascript',
    code = '',
    useWasm = true,
    onExecutionComplete,
    onData,
    onResize,
    onReady,
    initialData
}: ConsoleRunnerProps) {
    const [isRunning, setIsRunning] = useState(false);
    const [terminalWriter, setTerminalWriter] = useState<{ write: (data: string) => void } | null>(null);
    const [showPackageManager, setShowPackageManager] = useState(false);

    const wasmSupported = isWasmSupported(language);
    const shouldUseWasm = useWasm && wasmSupported;

    const handleTerminalReady = useCallback((id: string, writer: { write: (data: string) => void }) => {
        console.log(`[ConsoleRunner] Terminal ready: ${id}`);
        setTerminalWriter(writer);
        if (onReady) {
            onReady(id, writer);
        }
    }, [onReady]);

    const handleRunClick = async () => {
        console.log('[ConsoleRunner] ═══════════════════════════════════════');
        console.log('[ConsoleRunner] Run button clicked!');
        console.log('[ConsoleRunner] shouldUseWasm:', shouldUseWasm);
        console.log('[ConsoleRunner] wasmSupported:', wasmSupported);
        console.log('[ConsoleRunner] useWasm prop:', useWasm);
        console.log('[ConsoleRunner] code length:', code?.length);
        console.log('[ConsoleRunner] language:', language);
        console.log('[ConsoleRunner] terminalWriter:', !!terminalWriter);
        console.log('[ConsoleRunner] ═══════════════════════════════════════');

        if (shouldUseWasm && code) {
            // WASM execution (client-side)
            console.log('[ConsoleRunner] ✓ Starting WASM execution...');
            setIsRunning(true);

            try {
                // Clear terminal and show execution start
                if (terminalWriter) {
                    terminalWriter.write('\r\n\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\r\n');
                    terminalWriter.write('\x1b[33m⚡ Running with WASM (client-side execution)...\x1b[0m\r\n');
                    terminalWriter.write('\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\r\n\r\n');
                } else {
                    console.warn('[ConsoleRunner] ⚠ Terminal writer not ready, output will only appear in console');
                }

                console.log('[ConsoleRunner] Executing code...');
                const result = await executeCode(language, code);
                console.log('[ConsoleRunner] Execution result:', result);

                // Notify parent of execution completion
                if (onExecutionComplete) {
                    onExecutionComplete(result);
                }

                if (terminalWriter) {
                    if (result.success) {
                        terminalWriter.write('\x1b[32m✓ Output:\x1b[0m\r\n');
                        terminalWriter.write(result.output.replace(/\n/g, '\r\n') + '\r\n');
                        if (result.executionTime) {
                            terminalWriter.write(`\r\n\x1b[90m(Completed in ${result.executionTime.toFixed(2)}ms)\x1b[0m\r\n`);
                        }
                    } else {
                        terminalWriter.write('\x1b[31m✗ Error:\x1b[0m\r\n');
                        terminalWriter.write('\x1b[31m' + (result.error || 'Unknown error') + '\x1b[0m\r\n');
                        if (result.output) {
                            terminalWriter.write('\r\n\x1b[33mPartial output:\x1b[0m\r\n');
                            terminalWriter.write(result.output.replace(/\n/g, '\r\n') + '\r\n');
                        }
                    }
                    terminalWriter.write('\r\n');
                } else {
                    // Fallback: Show alert if terminal not ready
                    if (result.success) {
                        console.log('[ConsoleRunner] ✓ Success Output:', result.output);
                        alert(`✓ Success!\n\n${result.output}\n\n(Completed in ${result.executionTime?.toFixed(2)}ms)`);
                    } else {
                        console.error('[ConsoleRunner] ✗ Error:', result.error);
                        alert(`✗ Error!\n\n${result.error}${result.output ? '\n\nPartial output:\n' + result.output : ''}`);
                    }
                }
            } catch (error: any) {
                console.error('[ConsoleRunner] ✗ Execution exception:', error);
                if (terminalWriter) {
                    terminalWriter.write('\x1b[31m✗ Execution failed:\x1b[0m\r\n');
                    terminalWriter.write('\x1b[31m' + (error.message || String(error)) + '\x1b[0m\r\n\r\n');
                } else {
                    alert(`✗ Execution failed!\n\n${error.message || String(error)}`);
                }
            } finally {
                setIsRunning(false);
            }
        } else if (!shouldUseWasm) {
            // Container execution (backend)
            console.log('[ConsoleRunner] → Using container execution (calling onRun)');
            onRun();
        } else if (!code) {
            console.warn('[ConsoleRunner] ⚠ No code to execute');
            if (terminalWriter) {
                terminalWriter.write('\x1b[33m⚠ No code to execute. Please write some code first.\x1b[0m\r\n');
            } else {
                alert('⚠ No code to execute. Please write some code first.');
            }
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#1e1e1e]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#2b2b2b]">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#cccccc] flex items-center gap-2">
                    <span>Console Output</span>
                    {shouldUseWasm && (
                        <span className="text-[10px] px-2 py-0.5 bg-[#3b82f6]/20 text-[#3b82f6] rounded-full border border-[#3b82f6]/30 flex items-center gap-1">
                            <Zap size={10} />
                            WASM
                        </span>
                    )}
                </span>
                <div className="flex items-center gap-2">
                    {/* Package Manager Button - Only for Python and JavaScript */}
                    {shouldUseWasm && ['python', 'javascript'].includes(language) && (
                        <button
                            onClick={() => setShowPackageManager(true)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1e1e1e] hover:bg-[#2d2d2d] border border-[#3e3e42] hover:border-[#007acc] text-[#cccccc] rounded text-xs transition-all"
                            title="Manage Packages"
                        >
                            <Package size={12} />
                            <span>Packages</span>
                        </button>
                    )}

                    {/* Run Button */}
                    <button
                        onClick={handleRunClick}
                        disabled={isRunning}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#2da042] hover:bg-[#2c974b] disabled:bg-[#1a5a28] disabled:cursor-not-allowed text-white rounded font-medium text-xs transition-all active:scale-95"
                        title={shouldUseWasm ? "Run Code (WASM - Instant)" : "Run Code (Container)"}
                    >
                        {isRunning ? (
                            <>
                                <Loader2 size={12} className="animate-spin" />
                                <span>Running...</span>
                            </>
                        ) : (
                            <>
                                <Play size={12} fill="currentColor" />
                                <span>Run Code</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Terminal Area */}
            <div className="flex-1 overflow-hidden relative" style={{ minHeight: '100px' }}>
                <TerminalComponent
                    terminalId={terminalId}
                    isActive={true}
                    visible={true}
                    onData={onData}
                    onResize={onResize}
                    onReady={handleTerminalReady}
                    initialData={initialData}
                />
            </div>

            {/* Package Manager Modal */}
            {showPackageManager && (
                <PackageManagerHub
                    initialLanguage={language as 'python' | 'javascript'}
                    onClose={() => setShowPackageManager(false)}
                />
            )}
        </div>
    );
}
