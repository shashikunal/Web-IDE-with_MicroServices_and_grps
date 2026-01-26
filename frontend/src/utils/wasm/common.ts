/**
 * Common types and utilities for WASM execution
 */

export interface ExecutionResult {
    success: boolean;
    output: string;
    error?: string;
    executionTime?: number;
}

export interface WasmRunner {
    init(): Promise<void>;
    run(code: string): Promise<ExecutionResult>;
    isInitialized(): boolean;
}

/**
 * Utility to measure execution time
 */
export function measureExecutionTime<T>(
    fn: () => Promise<T>
): Promise<{ result: T; executionTime: number }> {
    const startTime = performance.now();
    return fn().then(result => ({
        result,
        executionTime: performance.now() - startTime
    }));
}

/**
 * Capture console output
 */
export function captureConsoleOutput(fn: () => void | Promise<void>): Promise<string[]> {
    const logs: string[] = [];
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args: any[]) => {
        logs.push(args.map(arg => String(arg)).join(' '));
    };
    console.error = (...args: any[]) => {
        logs.push('[ERROR] ' + args.map(arg => String(arg)).join(' '));
    };
    console.warn = (...args: any[]) => {
        logs.push('[WARN] ' + args.map(arg => String(arg)).join(' '));
    };

    return Promise.resolve(fn()).then(() => {
        console.log = originalLog;
        console.error = originalError;
        console.warn = originalWarn;
        return logs;
    });
}

/**
 * Format error message
 */
export function formatError(error: any): string {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.toString) return error.toString();
    return 'Unknown error';
}
