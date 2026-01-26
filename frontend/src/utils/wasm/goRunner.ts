/**
 * Go WASM Runner using TinyGo
 * Compiles and runs Go code in the browser
 */

import type { ExecutionResult, WasmRunner } from './common';
import { measureExecutionTime, formatError } from './common';

class GoRunner implements WasmRunner {
    private tinygo: any = null;
    private isLoading = false;

    async init(): Promise<void> {
        if (this.tinygo || this.isLoading) return;

        this.isLoading = true;
        try {
            // Load TinyGo WASM compiler
            const response = await fetch('https://cdn.jsdelivr.net/npm/@tinygo/wasm@0.1.0/tinygo.wasm');
            const wasmBytes = await response.arrayBuffer();

            const go = new (window as any).Go();
            const result = await WebAssembly.instantiate(wasmBytes, go.importObject);

            go.run(result.instance);
            this.tinygo = (window as any).tinygo;

            console.log('[WASM] TinyGo initialized successfully');
        } catch (error) {
            console.error('[WASM] Failed to initialize TinyGo:', error);
            throw new Error(`TinyGo initialization failed: ${formatError(error)}`);
        } finally {
            this.isLoading = false;
        }
    }

    isInitialized(): boolean {
        return this.tinygo !== null;
    }

    async run(code: string): Promise<ExecutionResult> {
        if (!this.tinygo) {
            await this.init();
        }

        const { result, executionTime } = await measureExecutionTime(async () => {
            try {
                let output = '';

                // Compile and run Go code
                const compiled = await this.tinygo.compile(code);

                if (compiled.error) {
                    return {
                        success: false,
                        output: '',
                        error: compiled.error
                    };
                }

                // Execute the compiled WASM
                const go = new (window as any).Go();
                const instance = await WebAssembly.instantiate(compiled.wasm, go.importObject);

                // Capture stdout
                const originalLog = console.log;
                console.log = (...args: any[]) => {
                    output += args.join(' ') + '\n';
                };

                await go.run(instance.instance);

                console.log = originalLog;

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
const goRunner = new GoRunner();

export async function runGo(code: string): Promise<ExecutionResult> {
    return goRunner.run(code);
}

export async function initGo(): Promise<void> {
    return goRunner.init();
}

export function isGoReady(): boolean {
    return goRunner.isInitialized();
}
