/**
 * WASM-based code execution utilities
 * Supports client-side execution for Python, C/C++, and other languages
 */

export interface ExecutionResult {
    success: boolean;
    output: string;
    error?: string;
    executionTime?: number;
}

// Python runner using Pyodide
let pyodideInstance: any = null;

export async function initPyodide(): Promise<void> {
    if (pyodideInstance) return;

    try {
        // @ts-ignore - Pyodide is loaded from CDN
        const { loadPyodide } = await import('https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.mjs');
        pyodideInstance = await loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/'
        });
        console.log('[WASM] Pyodide initialized');
    } catch (error) {
        console.error('[WASM] Failed to initialize Pyodide:', error);
        throw error;
    }
}

export async function runPython(code: string): Promise<ExecutionResult> {
    const startTime = performance.now();

    try {
        if (!pyodideInstance) {
            await initPyodide();
        }

        // Capture stdout
        let output = '';
        pyodideInstance.setStdout({
            batched: (text: string) => {
                output += text + '\n';
            }
        });

        // Run the code
        await pyodideInstance.runPythonAsync(code);

        const executionTime = performance.now() - startTime;

        return {
            success: true,
            output: output || '(Program completed with no output)',
            executionTime
        };
    } catch (error: any) {
        const executionTime = performance.now() - startTime;
        return {
            success: false,
            output: '',
            error: error.message || String(error),
            executionTime
        };
    }
}

// JavaScript/Node.js runner (native browser execution)
export async function runJavaScript(code: string): Promise<ExecutionResult> {
    const startTime = performance.now();

    try {
        // Capture console output
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

        // Execute in isolated scope
        const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
        const fn = new AsyncFunction(code);
        const result = await fn();

        // Restore console
        console.log = originalLog;
        console.error = originalError;
        console.warn = originalWarn;

        const executionTime = performance.now() - startTime;

        // Include return value if present
        if (result !== undefined) {
            logs.push(`=> ${String(result)}`);
        }

        return {
            success: true,
            output: logs.length > 0 ? logs.join('\n') : '(Program completed with no output)',
            executionTime
        };
    } catch (error: any) {
        const executionTime = performance.now() - startTime;
        return {
            success: false,
            output: '',
            error: error.message || String(error),
            executionTime
        };
    }
}

// C/C++ runner using JSCPP (JavaScript C++ interpreter)
let jscppInstance: any = null;

export async function initJSCPP(): Promise<void> {
    if (jscppInstance) return;

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
        jscppInstance = window.JSCPP;
        console.log('[WASM] JSCPP initialized');
    } catch (error) {
        console.error('[WASM] Failed to initialize JSCPP:', error);
        throw error;
    }
}

export async function runCpp(code: string): Promise<ExecutionResult> {
    const startTime = performance.now();

    try {
        if (!jscppInstance) {
            await initJSCPP();
        }

        let output = '';
        let errorOutput = '';

        const exitCode = await jscppInstance.run(code, '', {
            stdio: {
                write: (s: string) => {
                    output += s;
                },
                drain: () => { }
            },
            debug: false
        });

        const executionTime = performance.now() - startTime;

        if (exitCode !== 0) {
            return {
                success: false,
                output: output,
                error: `Program exited with code ${exitCode}`,
                executionTime
            };
        }

        return {
            success: true,
            output: output || '(Program completed with no output)',
            executionTime
        };
    } catch (error: any) {
        const executionTime = performance.now() - startTime;
        return {
            success: false,
            output: '',
            error: error.message || String(error),
            executionTime
        };
    }
}

// Ruby runner using ruby.wasm
let rubyInstance: any = null;

export async function initRuby(): Promise<void> {
    if (rubyInstance) return;

    try {
        // @ts-ignore
        const { DefaultRubyVM } = await import('https://cdn.jsdelivr.net/npm/@ruby/wasm-wasi@2.5.0/dist/browser.esm.js');
        const response = await fetch('https://cdn.jsdelivr.net/npm/@ruby/3.2-wasm-wasi@2.5.0/dist/ruby.wasm');
        const buffer = await response.arrayBuffer();
        const module = await WebAssembly.compile(buffer);

        const { vm } = await DefaultRubyVM(module);
        rubyInstance = vm;
        console.log('[WASM] Ruby initialized');
    } catch (error) {
        console.error('[WASM] Failed to initialize Ruby:', error);
        throw error;
    }
}

export async function runRuby(code: string): Promise<ExecutionResult> {
    const startTime = performance.now();

    try {
        if (!rubyInstance) {
            await initRuby();
        }

        const result = rubyInstance.eval(code);
        const executionTime = performance.now() - startTime;

        return {
            success: true,
            output: result.toString(),
            executionTime
        };
    } catch (error: any) {
        const executionTime = performance.now() - startTime;
        return {
            success: false,
            output: '',
            error: error.message || String(error),
            executionTime
        };
    }
}

// PHP runner using php-wasm
let phpInstance: any = null;

export async function initPHP(): Promise<void> {
    if (phpInstance) return;

    try {
        // @ts-ignore
        const { PhpWeb } = await import('https://cdn.jsdelivr.net/npm/php-wasm@0.0.9/PhpWeb.mjs');
        phpInstance = new PhpWeb();
        console.log('[WASM] PHP initialized');
    } catch (error) {
        console.error('[WASM] Failed to initialize PHP:', error);
        throw error;
    }
}

export async function runPHP(code: string): Promise<ExecutionResult> {
    const startTime = performance.now();

    try {
        if (!phpInstance) {
            await initPHP();
        }

        const result = await phpInstance.run(code);
        const executionTime = performance.now() - startTime;

        return {
            success: true,
            output: result.stdout || '(Program completed with no output)',
            executionTime
        };
    } catch (error: any) {
        const executionTime = performance.now() - startTime;
        return {
            success: false,
            output: '',
            error: error.message || String(error),
            executionTime
        };
    }
}

// Main execution dispatcher
export async function executeCode(language: string, code: string): Promise<ExecutionResult> {
    switch (language.toLowerCase()) {
        case 'python':
            return runPython(code);
        case 'javascript':
        case 'js':
        case 'node':
            return runJavaScript(code);
        case 'cpp':
        case 'c++':
            return runCpp(code);
        case 'c':
            // C code can be run through C++ interpreter
            return runCpp(code);
        case 'ruby':
            return runRuby(code);
        case 'php':
            return runPHP(code);
        default:
            return {
                success: false,
                output: '',
                error: `WASM execution not supported for ${language}. Using container execution instead.`
            };
    }
}

// Check if WASM execution is available for a language
export function isWasmSupported(language: string): boolean {
    const supported = ['python', 'javascript', 'js', 'node', 'cpp', 'c++', 'c', 'ruby', 'php'];
    return supported.includes(language.toLowerCase());
}
