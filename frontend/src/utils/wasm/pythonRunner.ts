/**
 * Python WASM Runner using Pyodide
 * Provides full Python 3.11 runtime in the browser
 */

import type { ExecutionResult, WasmRunner } from './common';
import { measureExecutionTime, formatError } from './common';

class PythonRunner implements WasmRunner {
    private pyodide: any = null;
    private isLoading = false;

    async init(): Promise<void> {
        if (this.pyodide || this.isLoading) return;

        this.isLoading = true;
        try {
            // @ts-ignore - Pyodide is loaded from CDN
            const { loadPyodide } = await import('https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.mjs');
            this.pyodide = await loadPyodide({
                indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/'
            });
            console.log('[WASM] Pyodide initialized successfully');
        } catch (error) {
            console.error('[WASM] Failed to initialize Pyodide:', error);
            throw new Error(`Pyodide initialization failed: ${formatError(error)}`);
        } finally {
            this.isLoading = false;
        }
    }

    isInitialized(): boolean {
        return this.pyodide !== null;
    }

    async run(code: string): Promise<ExecutionResult> {
        if (!this.pyodide) {
            await this.init();
        }

        const { result, executionTime } = await measureExecutionTime(async () => {
            try {
                // Capture stdout
                let output = '';
                this.pyodide.setStdout({
                    batched: (text: string) => {
                        output += text + '\n';
                    }
                });

                // Run the code
                await this.pyodide.runPythonAsync(code);

                return {
                    success: true,
                    output: output || '(Program completed with no output)'
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
const pythonRunner = new PythonRunner();

export async function runPython(code: string): Promise<ExecutionResult> {
    return pythonRunner.run(code);
}

export async function initPython(): Promise<void> {
    return pythonRunner.init();
}

export function isPythonReady(): boolean {
    return pythonRunner.isInitialized();
}
