/**
 * Main WASM Execution Dispatcher
 * Routes code execution to appropriate language-specific runners
 */

import type { ExecutionResult } from './common';
import { runPython } from './pythonRunner';
import { runJavaScript } from './javascriptRunner';
import { runCpp } from './cppRunner';
import { runJava } from './javaRunner'; // Basic runner - directs to container
import { runRuby } from './rubyRunner';
import { runPHP } from './phpRunner';
import { runLua } from './luaRunner';
import { runGo } from './goRunner';

// Re-export types
export type { ExecutionResult } from './common';

// Re-export package manager
export * from './packageManager';

// Re-export preloader
export * from './preloader';

// Note: Java JAR management removed - use container execution for Java
// Container provides full Maven support without CORS issues

/**
 * Language support mapping
 */
const SUPPORTED_LANGUAGES = {
    python: runPython,
    javascript: runJavaScript,
    js: runJavaScript,
    node: runJavaScript,
    typescript: runJavaScript, // TypeScript can be transpiled client-side
    cpp: runCpp,
    'c++': runCpp,
    c: runCpp, // C code can run through C++ interpreter
    // java: runJava, // Removed - use container execution for better support
    ruby: runRuby,
    php: runPHP,
    lua: runLua,
    go: runGo,
    golang: runGo
} as const;

/**
 * Execute code in the appropriate WASM runtime
 */
export async function executeCode(language: string, code: string): Promise<ExecutionResult> {
    const normalizedLang = language.toLowerCase();
    const runner = SUPPORTED_LANGUAGES[normalizedLang as keyof typeof SUPPORTED_LANGUAGES];

    if (!runner) {
        return {
            success: false,
            output: '',
            error: `WASM execution not supported for ${language}. Using container execution instead.`
        };
    }

    try {
        return await runner(code);
    } catch (error: any) {
        return {
            success: false,
            output: '',
            error: `Execution failed: ${error.message || String(error)}`
        };
    }
}

/**
 * Check if WASM execution is available for a language
 */
export function isWasmSupported(language: string): boolean {
    const normalizedLang = language.toLowerCase();
    return normalizedLang in SUPPORTED_LANGUAGES;
}

/**
 * Get list of all supported languages
 */
export function getSupportedLanguages(): string[] {
    return Object.keys(SUPPORTED_LANGUAGES);
}

/**
 * Pre-initialize a specific language runtime
 */
export async function preloadLanguage(language: string): Promise<void> {
    const normalizedLang = language.toLowerCase();

    // Import and initialize the specific runner
    switch (normalizedLang) {
        case 'python':
            const { initPython } = await import('./pythonRunner');
            return initPython();
        case 'javascript':
        case 'js':
        case 'node':
            const { initJavaScript } = await import('./javascriptRunner');
            return initJavaScript();
        case 'cpp':
        case 'c++':
        case 'c':
            const { initCpp } = await import('./cppRunner');
            return initCpp();
        case 'java':
            const { initJava } = await import('./javaRunner');
            return initJava();
        case 'ruby':
            const { initRuby } = await import('./rubyRunner');
            return initRuby();
        case 'php':
            const { initPHP } = await import('./phpRunner');
            return initPHP();
        case 'lua':
            const { initLua } = await import('./luaRunner');
            return initLua();
        case 'go':
        case 'golang':
            const { initGo } = await import('./goRunner');
            return initGo();
        default:
            throw new Error(`Language ${language} not supported for WASM execution`);
    }
}

/**
 * Pre-initialize all language runtimes (for faster first execution)
 */
export async function preloadAllLanguages(): Promise<void> {
    const languages = getSupportedLanguages();
    await Promise.all(languages.map(lang => preloadLanguage(lang).catch(err => {
        console.warn(`Failed to preload ${lang}:`, err);
    })));
}
