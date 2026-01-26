/**
 * Enhanced Java WASM Runner using CheerpJ
 * Provides Java 11+ runtime with external JAR support in the browser
 */

import type { ExecutionResult, WasmRunner } from './common';
import { measureExecutionTime, formatError } from './common';

interface JarFile {
    name: string;
    url: string;
    loaded: boolean;
}

class EnhancedJavaRunner implements WasmRunner {
    private cheerpj: any = null;
    private isLoading = false;
    private loadedJars: Map<string, JarFile> = new Map();
    private classPath: string[] = [];

    async init(): Promise<void> {
        if (this.cheerpj || this.isLoading) return;

        this.isLoading = true;
        try {
            // Load CheerpJ runtime
            const script = document.createElement('script');
            script.src = 'https://cjrtnc.leaningtech.com/3.0/cj3loader.js';

            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });

            // Initialize CheerpJ
            // @ts-ignore
            await window.cheerpjInit();

            // @ts-ignore
            this.cheerpj = window.cheerpjRunJar;

            console.log('[WASM] CheerpJ (Java 11+) initialized successfully');
        } catch (error) {
            console.error('[WASM] Failed to initialize CheerpJ:', error);
            throw new Error(`CheerpJ initialization failed: ${formatError(error)}`);
        } finally {
            this.isLoading = false;
        }
    }

    isInitialized(): boolean {
        return this.cheerpj !== null;
    }

    /**
     * Load an external JAR file
     */
    async loadJar(jarUrl: string, jarName?: string): Promise<void> {
        if (!this.cheerpj) {
            await this.init();
        }

        const name = jarName || jarUrl.split('/').pop() || 'library.jar';

        if (this.loadedJars.has(name)) {
            console.log(`[Java] JAR ${name} already loaded`);
            return;
        }

        try {
            // Download JAR file
            const response = await fetch(jarUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch JAR: ${response.statusText}`);
            }

            const jarData = await response.arrayBuffer();

            // Store JAR in CheerpJ virtual filesystem
            // @ts-ignore
            await window.cheerpjAddStringFile(`/app/lib/${name}`, new Uint8Array(jarData));

            // Add to classpath
            this.classPath.push(`/app/lib/${name}`);

            this.loadedJars.set(name, {
                name,
                url: jarUrl,
                loaded: true
            });

            console.log(`[Java] Loaded JAR: ${name}`);
        } catch (error) {
            throw new Error(`Failed to load JAR ${name}: ${formatError(error)}`);
        }
    }

    /**
     * Load multiple JAR files
     */
    async loadJars(jars: Array<{ url: string; name?: string }>): Promise<void> {
        await Promise.all(jars.map(jar => this.loadJar(jar.url, jar.name)));
    }

    /**
     * Get list of loaded JARs
     */
    getLoadedJars(): JarFile[] {
        return Array.from(this.loadedJars.values());
    }

    /**
     * Clear all loaded JARs
     */
    clearJars(): void {
        this.loadedJars.clear();
        this.classPath = [];
    }

    async run(code: string, mainClass?: string): Promise<ExecutionResult> {
        if (!this.cheerpj) {
            await this.init();
        }

        const { result, executionTime } = await measureExecutionTime(async () => {
            try {
                // Extract class name if not provided
                let className = mainClass;
                if (!className) {
                    const classMatch = code.match(/public\s+class\s+(\w+)/);
                    className = classMatch ? classMatch[1] : 'Main';
                }

                let output = '';
                let errorOutput = '';

                // Create virtual filesystem for source file
                const sourceFile = `${className}.java`;
                // @ts-ignore
                await window.cheerpjAddStringFile(`/app/${sourceFile}`, code);

                // Compile Java source
                const compileClassPath = this.classPath.length > 0
                    ? `-cp ${this.classPath.join(':')}:/app`
                    : '-cp /app';

                // @ts-ignore
                const compileResult = await window.cheerpjRunJar(
                    '/app/tools.jar',
                    'com.sun.tools.javac.Main',
                    compileClassPath,
                    '-d',
                    '/app',
                    `/app/${sourceFile}`
                );

                if (compileResult !== 0) {
                    return {
                        success: false,
                        output: '',
                        error: 'Compilation failed. Check your Java syntax.'
                    };
                }

                // Capture stdout/stderr
                const originalConsoleLog = console.log;
                const originalConsoleError = console.error;

                console.log = (...args: any[]) => {
                    output += args.join(' ') + '\n';
                };
                console.error = (...args: any[]) => {
                    errorOutput += args.join(' ') + '\n';
                };

                // Run the compiled class
                const runClassPath = this.classPath.length > 0
                    ? `-cp ${this.classPath.join(':')}:/app`
                    : '-cp /app';

                // @ts-ignore
                const exitCode = await window.cheerpjRunMain(
                    className,
                    runClassPath
                );

                // Restore console
                console.log = originalConsoleLog;
                console.error = originalConsoleError;

                if (exitCode !== 0 || errorOutput) {
                    return {
                        success: false,
                        output: output,
                        error: errorOutput || `Program exited with code ${exitCode}`
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
const enhancedJavaRunner = new EnhancedJavaRunner();

export async function runJava(code: string, mainClass?: string): Promise<ExecutionResult> {
    return enhancedJavaRunner.run(code, mainClass);
}

export async function initJava(): Promise<void> {
    return enhancedJavaRunner.init();
}

export function isJavaReady(): boolean {
    return enhancedJavaRunner.isInitialized();
}

/**
 * Load external JAR file for use in Java code
 */
export async function loadJavaJar(jarUrl: string, jarName?: string): Promise<void> {
    return enhancedJavaRunner.loadJar(jarUrl, jarName);
}

/**
 * Load multiple JAR files
 */
export async function loadJavaJars(jars: Array<{ url: string; name?: string }>): Promise<void> {
    return enhancedJavaRunner.loadJars(jars);
}

/**
 * Get list of loaded JAR files
 */
export function getLoadedJavaJars(): Array<{ name: string; url: string; loaded: boolean }> {
    return enhancedJavaRunner.getLoadedJars();
}

/**
 * Clear all loaded JAR files
 */
export function clearJavaJars(): void {
    return enhancedJavaRunner.clearJars();
}

/**
 * Common JAR libraries that can be loaded
 */
export const COMMON_JAVA_JARS = {
    // Apache Commons
    'commons-lang3': 'https://repo1.maven.org/maven2/org/apache/commons/commons-lang3/3.14.0/commons-lang3-3.14.0.jar',
    'commons-io': 'https://repo1.maven.org/maven2/commons-io/commons-io/2.15.1/commons-io-2.15.1.jar',
    'commons-collections4': 'https://repo1.maven.org/maven2/org/apache/commons/commons-collections4/4.4/commons-collections4-4.4.jar',

    // Google Guava
    'guava': 'https://repo1.maven.org/maven2/com/google/guava/guava/33.0.0-jre/guava-33.0.0-jre.jar',

    // JSON Processing
    'gson': 'https://repo1.maven.org/maven2/com/google/code/gson/gson/2.10.1/gson-2.10.1.jar',
    'jackson-core': 'https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-core/2.16.1/jackson-core-2.16.1.jar',
    'jackson-databind': 'https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-databind/2.16.1/jackson-databind-2.16.1.jar',

    // Logging
    'slf4j-api': 'https://repo1.maven.org/maven2/org/slf4j/slf4j-api/2.0.11/slf4j-api-2.0.11.jar',
    'logback-classic': 'https://repo1.maven.org/maven2/ch/qos/logback/logback-classic/1.4.14/logback-classic-1.4.14.jar',

    // Testing
    'junit': 'https://repo1.maven.org/maven2/junit/junit/4.13.2/junit-4.13.2.jar',
    'junit-jupiter': 'https://repo1.maven.org/maven2/org/junit/jupiter/junit-jupiter/5.10.1/junit-jupiter-5.10.1.jar',
};

/**
 * Load a common JAR library by name
 */
export async function loadCommonJar(libraryName: keyof typeof COMMON_JAVA_JARS): Promise<void> {
    const jarUrl = COMMON_JAVA_JARS[libraryName];
    if (!jarUrl) {
        throw new Error(`Unknown library: ${libraryName}`);
    }
    return loadJavaJar(jarUrl, `${libraryName}.jar`);
}

/**
 * Load multiple common JAR libraries
 */
export async function loadCommonJars(libraries: Array<keyof typeof COMMON_JAVA_JARS>): Promise<void> {
    const jars = libraries.map(lib => ({
        url: COMMON_JAVA_JARS[lib],
        name: `${lib}.jar`
    }));
    return loadJavaJars(jars);
}
