/**
 * PHP WASM Runner using php-wasm
 * Provides PHP 8.2 runtime in the browser
 */

import type { ExecutionResult, WasmRunner } from './common';
import { measureExecutionTime, formatError } from './common';

class PHPRunner implements WasmRunner {
    private php: any = null;
    private isLoading = false;

    async init(): Promise<void> {
        if (this.php || this.isLoading) return;

        this.isLoading = true;
        try {
            // @ts-ignore
            const { PhpWeb } = await import('https://cdn.jsdelivr.net/npm/php-wasm@0.0.9/PhpWeb.mjs');
            this.php = new PhpWeb();
            console.log('[WASM] PHP initialized successfully');
        } catch (error) {
            console.error('[WASM] Failed to initialize PHP:', error);
            throw new Error(`PHP initialization failed: ${formatError(error)}`);
        } finally {
            this.isLoading = false;
        }
    }

    isInitialized(): boolean {
        return this.php !== null;
    }

    async run(code: string): Promise<ExecutionResult> {
        if (!this.php) {
            await this.init();
        }

        const { result, executionTime } = await measureExecutionTime(async () => {
            try {
                const output = await this.php.run(code);

                return {
                    success: true,
                    output: output.stdout || '(Program completed with no output)'
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
const phpRunner = new PHPRunner();

export async function runPHP(code: string): Promise<ExecutionResult> {
    return phpRunner.run(code);
}

export async function initPHP(): Promise<void> {
    return phpRunner.init();
}

export function isPHPReady(): boolean {
    return phpRunner.isInitialized();
}
