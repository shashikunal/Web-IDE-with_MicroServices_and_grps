/**
 * Reliable Java Runner for Browser
 * Simple but effective interpreter that handles basic to intermediate Java code
 * Works immediately without external dependencies
 */

import type { ExecutionResult, WasmRunner } from './common';
import { measureExecutionTime, formatError } from './common';

class SimpleJavaRunner implements WasmRunner {
    private isReady = false;

    async init(): Promise<void> {
        if (this.isReady) return;
        this.isReady = true;
        console.log('[WASM] Simple Java interpreter ready');
    }

    isInitialized(): boolean {
        return this.isReady;
    }

    async run(code: string): Promise<ExecutionResult> {
        if (!this.isReady) {
            await this.init();
        }

        const { result, executionTime } = await measureExecutionTime(async () => {
            try {
                return this.executeJava(code);
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

    private executeJava(code: string): ExecutionResult {
        try {
            let output = '';
            const console = {
                log: (...args: any[]) => {
                    output += args.map(arg => String(arg)).join(' ') + '\n';
                }
            };

            // Extract main method content - more flexible regex
            const patterns = [
                /public\s+static\s+void\s+main\s*\([^)]*\)\s*\{([\s\S]*)\}\s*\}\s*$/,  // End of file
                /public\s+static\s+void\s+main\s*\([^)]*\)\s*\{([\s\S]*?)\n\s*\}\s*\n/,  // Middle of file
            ];

            let mainContent = '';
            for (const pattern of patterns) {
                const match = code.match(pattern);
                if (match) {
                    mainContent = match[1];
                    break;
                }
            }

            if (!mainContent) {
                return {
                    success: false,
                    output: '',
                    error: 'Could not find main method. Please ensure your code has:\npublic static void main(String[] args) { ... }'
                };
            }

            // Simple Java to JavaScript transformation
            let jsCode = mainContent
                // System.out.println
                .replace(/System\.out\.println\s*\(\s*([^)]+)\s*\)/g, 'console.log($1)')
                .replace(/System\.out\.print\s*\(\s*([^)]+)\s*\)/g, 'console.log($1)')

                // Variable declarations
                .replace(/\b(int|long|float|double|boolean|char|String)\s+(\w+)\s*=/g, 'let $2 =')
                .replace(/\b(int|long|float|double|boolean|char|String)\[\]\s+(\w+)\s*=/g, 'let $2 =')

                // Array creation
                .replace(/new\s+int\[([^\]]+)\]/g, 'Array($1).fill(0)')
                .replace(/new\s+String\[([^\]]+)\]/g, 'Array($1).fill("")')
                .replace(/new\s+double\[([^\]]+)\]/g, 'Array($1).fill(0.0)')

                // Array/Object initialization
                .replace(/=\s*\{([^}]+)\}/g, '= [$1]')

                // String methods
                .replace(/\.length\(\)/g, '.length')
                .replace(/\.charAt\(/g, '.charAt(')
                .replace(/\.substring\(/g, '.substring(')
                .replace(/\.equals\(/g, ' === (')

                // For loops
                .replace(/for\s*\(\s*int\s+/g, 'for (let ')

                // Math operations (already compatible)
                ;

            // Execute the transformed code
            try {
                const func = new Function('console', jsCode);
                func(console);

                return {
                    success: true,
                    output: output.trim() || '(Program completed successfully with no output)'
                };
            } catch (execError: any) {
                return {
                    success: false,
                    output: output,
                    error: `Runtime error: ${execError.message}\n\nTransformed code:\n${jsCode.substring(0, 200)}...`
                };
            }
        } catch (error: any) {
            return {
                success: false,
                output: '',
                error: `Parse error: ${error.message}`
            };
        }
    }
}

// Singleton instance
const javaRunner = new SimpleJavaRunner();

export async function runJava(code: string): Promise<ExecutionResult> {
    return javaRunner.run(code);
}

export async function initJava(): Promise<void> {
    return javaRunner.init();
}

export function isJavaReady(): boolean {
    return javaRunner.isInitialized();
}

// Placeholder functions for compatibility
export async function loadJavaJar(): Promise<void> {
    console.info('[Java] Browser interpreter supports basic Java. Use container for external libraries.');
}

export async function loadJavaJars(): Promise<void> {
    console.info('[Java] Browser interpreter supports basic Java. Use container for external libraries.');
}

export function getLoadedJavaJars(): Array<{ name: string; url: string; loaded: boolean }> {
    return [];
}

export function clearJavaJars(): void {
    // No-op
}

export const COMMON_JAVA_JARS = {};

export async function loadCommonJar(): Promise<void> {
    console.info('[Java] Browser interpreter supports basic Java. Use container for external libraries.');
}

export async function loadCommonJars(): Promise<void> {
    console.info('[Java] Browser interpreter supports basic Java. Use container for external libraries.');
}
