/**
 * C/C++ WASM Runner using JSCPP
 * Interprets C++ code in the browser
 */

import type { ExecutionResult, WasmRunner } from './common';
import { measureExecutionTime, formatError } from './common';

class CppRunner implements WasmRunner {
    private jscpp: any = null;
    private isLoading = false;

    async init(): Promise<void> {
        if (this.jscpp || this.isLoading) return;

        this.isLoading = true;
        try {
            // Load JSCPP from CDN
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/jscpp@1.1.3/dist/JSCPP.es5.min.js';

            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });

            // @ts-ignore
            this.jscpp = window.JSCPP;
            console.log('[WASM] JSCPP initialized successfully');
        } catch (error) {
            console.error('[WASM] Failed to initialize JSCPP:', error);
            throw new Error(`JSCPP initialization failed: ${formatError(error)}`);
        } finally {
            this.isLoading = false;
        }
    }

    isInitialized(): boolean {
        return this.jscpp !== null;
    }

    async run(code: string): Promise<ExecutionResult> {
        if (!this.jscpp) {
            await this.init();
        }

        const { result, executionTime } = await measureExecutionTime(async () => {
            try {
                let output = '';

                const exitCode = await this.jscpp.run(code, '', {
                    stdio: {
                        write: (s: string) => {
                            output += s;
                        },
                        drain: () => { }
                    },
                    debug: false
                });

                if (exitCode !== 0) {
                    return {
                        success: false,
                        output: output,
                        error: `Program exited with code ${exitCode}`
                    };
                }

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
const cppRunner = new CppRunner();

export async function runCpp(code: string): Promise<ExecutionResult> {
    return cppRunner.run(code);
}

export async function initCpp(): Promise<void> {
    return cppRunner.init();
}

export function isCppReady(): boolean {
    return cppRunner.isInitialized();
}
