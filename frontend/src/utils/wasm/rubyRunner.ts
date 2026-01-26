/**
 * Ruby WASM Runner using ruby.wasm
 * Provides Ruby 3.2 runtime in the browser
 */

import type { ExecutionResult, WasmRunner } from './common';
import { measureExecutionTime, formatError } from './common';

class RubyRunner implements WasmRunner {
    private ruby: any = null;
    private isLoading = false;

    async init(): Promise<void> {
        if (this.ruby || this.isLoading) return;

        this.isLoading = true;
        try {
            // @ts-ignore
            const { DefaultRubyVM } = await import('https://cdn.jsdelivr.net/npm/@ruby/wasm-wasi@2.5.0/dist/browser.esm.js');
            const response = await fetch('https://cdn.jsdelivr.net/npm/@ruby/3.2-wasm-wasi@2.5.0/dist/ruby.wasm');
            const buffer = await response.arrayBuffer();
            const module = await WebAssembly.compile(buffer);

            const { vm } = await DefaultRubyVM(module);
            this.ruby = vm;
            console.log('[WASM] Ruby initialized successfully');
        } catch (error) {
            console.error('[WASM] Failed to initialize Ruby:', error);
            throw new Error(`Ruby initialization failed: ${formatError(error)}`);
        } finally {
            this.isLoading = false;
        }
    }

    isInitialized(): boolean {
        return this.ruby !== null;
    }

    async run(code: string): Promise<ExecutionResult> {
        if (!this.ruby) {
            await this.init();
        }

        const { result, executionTime } = await measureExecutionTime(async () => {
            try {
                const output = this.ruby.eval(code);

                return {
                    success: true,
                    output: output.toString() || '(Program completed with no output)'
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
const rubyRunner = new RubyRunner();

export async function runRuby(code: string): Promise<ExecutionResult> {
    return rubyRunner.run(code);
}

export async function initRuby(): Promise<void> {
    return rubyRunner.init();
}

export function isRubyReady(): boolean {
    return rubyRunner.isInitialized();
}
