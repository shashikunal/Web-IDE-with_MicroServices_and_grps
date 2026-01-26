/**
 * JavaScript WASM Runner (Native Browser Execution)
 * Executes JavaScript code directly in the browser
 */

import type { ExecutionResult, WasmRunner } from './common';
import { measureExecutionTime, captureConsoleOutput, formatError } from './common';

class JavaScriptRunner implements WasmRunner {
    async init(): Promise<void> {
        // No initialization needed for native JavaScript
        return Promise.resolve();
    }

    isInitialized(): boolean {
        return true; // Always ready
    }

    async run(code: string): Promise<ExecutionResult> {
        const { result, executionTime } = await measureExecutionTime(async () => {
            try {
                const logs = await captureConsoleOutput(async () => {
                    // Execute in isolated scope
                    const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
                    const fn = new AsyncFunction(code);
                    const result = await fn();

                    // Include return value if present
                    if (result !== undefined) {
                        console.log(`=> ${String(result)}`);
                    }
                });

                return {
                    success: true,
                    output: logs.length > 0 ? logs.join('\n') : '(Program completed with no output)'
                };
            } catch (error: any) {
                return {
                    success: false,
                    output: '',
                    error: formatError(error)
                };
            }
        });

        return { ...result, executionTime };
    }
}

// Singleton instance
const jsRunner = new JavaScriptRunner();

export async function runJavaScript(code: string): Promise<ExecutionResult> {
    return jsRunner.run(code);
}

export async function initJavaScript(): Promise<void> {
    return jsRunner.init();
}

export function isJavaScriptReady(): boolean {
    return jsRunner.isInitialized();
}
