/**
 * Runtime Preloader
 * Pre-initializes WASM runtimes to eliminate first-load delays
 */

import { initPython } from './pythonRunner';
import { initJavaScript } from './javascriptRunner';
import { initCpp } from './cppRunner';
import { initJava } from './javaRunner';
import { initRuby } from './rubyRunner';
import { initPHP } from './phpRunner';
import { initLua } from './luaRunner';
import { initGo } from './goRunner';

export interface PreloadProgress {
    language: string;
    status: 'pending' | 'loading' | 'ready' | 'error';
    progress: number; // 0-100
    error?: string;
    startTime?: number;
    endTime?: number;
}

export type PreloadCallback = (progress: PreloadProgress[]) => void;

class RuntimePreloader {
    private progress: Map<string, PreloadProgress> = new Map();
    private callbacks: Set<PreloadCallback> = new Set();
    private isPreloading = false;

    /**
     * Register a callback for progress updates
     */
    onProgress(callback: PreloadCallback): () => void {
        this.callbacks.add(callback);

        // Return unsubscribe function
        return () => {
            this.callbacks.delete(callback);
        };
    }

    /**
     * Notify all callbacks of progress update
     */
    private notifyProgress(): void {
        const progressArray = Array.from(this.progress.values());
        this.callbacks.forEach(cb => cb(progressArray));
    }

    /**
     * Update progress for a language
     */
    private updateProgress(language: string, updates: Partial<PreloadProgress>): void {
        const current = this.progress.get(language) || {
            language,
            status: 'pending',
            progress: 0
        };

        this.progress.set(language, { ...current, ...updates });
        this.notifyProgress();
    }

    /**
     * Preload a specific language runtime
     */
    async preloadLanguage(language: string): Promise<void> {
        this.updateProgress(language, {
            status: 'loading',
            progress: 10,
            startTime: Date.now()
        });

        try {
            let initFn: (() => Promise<void>) | null = null;

            switch (language.toLowerCase()) {
                case 'python':
                    initFn = initPython;
                    break;
                case 'javascript':
                    initFn = initJavaScript;
                    break;
                case 'cpp':
                case 'c++':
                    initFn = initCpp;
                    break;
                case 'java':
                    initFn = initJava;
                    break;
                case 'ruby':
                    initFn = initRuby;
                    break;
                case 'php':
                    initFn = initPHP;
                    break;
                case 'lua':
                    initFn = initLua;
                    break;
                case 'go':
                    initFn = initGo;
                    break;
                default:
                    throw new Error(`Unknown language: ${language}`);
            }

            this.updateProgress(language, { progress: 50 });

            await initFn();

            this.updateProgress(language, {
                status: 'ready',
                progress: 100,
                endTime: Date.now()
            });
        } catch (error: any) {
            this.updateProgress(language, {
                status: 'error',
                progress: 0,
                error: error.message || String(error),
                endTime: Date.now()
            });
            throw error;
        }
    }

    /**
     * Preload multiple languages
     */
    async preloadLanguages(languages: string[]): Promise<void> {
        if (this.isPreloading) {
            console.warn('Preloading already in progress');
            return;
        }

        this.isPreloading = true;

        // Initialize progress for all languages
        languages.forEach(lang => {
            this.updateProgress(lang, {
                status: 'pending',
                progress: 0
            });
        });

        try {
            // Preload in parallel
            await Promise.allSettled(
                languages.map(lang => this.preloadLanguage(lang))
            );
        } finally {
            this.isPreloading = false;
        }
    }

    /**
     * Preload all supported languages
     */
    async preloadAll(): Promise<void> {
        const allLanguages = ['python', 'javascript', 'cpp', 'java', 'ruby', 'php', 'lua', 'go'];
        return this.preloadLanguages(allLanguages);
    }

    /**
     * Preload common languages (faster subset)
     */
    async preloadCommon(): Promise<void> {
        const commonLanguages = ['python', 'javascript', 'cpp', 'java'];
        return this.preloadLanguages(commonLanguages);
    }

    /**
     * Get current progress for all languages
     */
    getProgress(): PreloadProgress[] {
        return Array.from(this.progress.values());
    }

    /**
     * Get progress for a specific language
     */
    getLanguageProgress(language: string): PreloadProgress | undefined {
        return this.progress.get(language);
    }

    /**
     * Check if a language is ready
     */
    isReady(language: string): boolean {
        const progress = this.progress.get(language);
        return progress?.status === 'ready';
    }

    /**
     * Check if all languages are ready
     */
    areAllReady(): boolean {
        return Array.from(this.progress.values()).every(p => p.status === 'ready');
    }

    /**
     * Reset preloader state
     */
    reset(): void {
        this.progress.clear();
        this.isPreloading = false;
        this.notifyProgress();
    }
}

// Singleton instance
export const runtimePreloader = new RuntimePreloader();

// Convenience exports
export const preloadLanguage = (lang: string) => runtimePreloader.preloadLanguage(lang);
export const preloadLanguages = (langs: string[]) => runtimePreloader.preloadLanguages(langs);
export const preloadAll = () => runtimePreloader.preloadAll();
export const preloadCommon = () => runtimePreloader.preloadCommon();
export const getPreloadProgress = () => runtimePreloader.getProgress();
export const isLanguageReady = (lang: string) => runtimePreloader.isReady(lang);
