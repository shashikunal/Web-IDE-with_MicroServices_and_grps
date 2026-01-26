/**
 * Package Manager for WASM Runtimes
 * Allows installing packages for Python, JavaScript, etc.
 */

import { isPythonReady } from './pythonRunner';

export interface PackageInstallResult {
    success: boolean;
    message: string;
    installedPackages?: string[];
    error?: string;
}

/**
 * Python package manager using micropip (Pyodide)
 */
export async function installPythonPackage(packageName: string): Promise<PackageInstallResult> {
    try {
        if (!isPythonReady()) {
            return {
                success: false,
                message: 'Python runtime not initialized',
                error: 'Please run Python code first to initialize Pyodide'
            };
        }

        // @ts-ignore - Access global pyodide instance
        const pyodide = (window as any).pyodide;

        if (!pyodide) {
            throw new Error('Pyodide not found');
        }

        // Use micropip to install package
        await pyodide.loadPackage('micropip');
        const micropip = pyodide.pyimport('micropip');

        await micropip.install(packageName);

        return {
            success: true,
            message: `Successfully installed ${packageName}`,
            installedPackages: [packageName]
        };
    } catch (error: any) {
        return {
            success: false,
            message: `Failed to install ${packageName}`,
            error: error.message || String(error)
        };
    }
}

/**
 * Install multiple Python packages
 */
export async function installPythonPackages(packages: string[]): Promise<PackageInstallResult> {
    const installed: string[] = [];
    const errors: string[] = [];

    for (const pkg of packages) {
        const result = await installPythonPackage(pkg);
        if (result.success) {
            installed.push(pkg);
        } else {
            errors.push(`${pkg}: ${result.error}`);
        }
    }

    return {
        success: errors.length === 0,
        message: `Installed ${installed.length}/${packages.length} packages`,
        installedPackages: installed,
        error: errors.length > 0 ? errors.join('; ') : undefined
    };
}

/**
 * List installed Python packages
 */
export async function listPythonPackages(): Promise<string[]> {
    try {
        // @ts-ignore
        const pyodide = (window as any).pyodide;

        if (!pyodide) {
            return [];
        }

        const result = await pyodide.runPythonAsync(`
import micropip
list(micropip.list())
    `);

        return result || [];
    } catch (error) {
        console.error('Failed to list packages:', error);
        return [];
    }
}

/**
 * JavaScript/NPM package loader using esm.sh CDN
 */
export async function loadJavaScriptPackage(packageName: string, version?: string): Promise<PackageInstallResult> {
    try {
        const pkgUrl = version
            ? `https://esm.sh/${packageName}@${version}`
            : `https://esm.sh/${packageName}`;

        const module = await import(/* @vite-ignore */ pkgUrl);

        // Store in global scope for user code access
        (window as any)[packageName.replace(/[^a-zA-Z0-9]/g, '_')] = module;

        return {
            success: true,
            message: `Successfully loaded ${packageName}`,
            installedPackages: [packageName]
        };
    } catch (error: any) {
        return {
            success: false,
            message: `Failed to load ${packageName}`,
            error: error.message || String(error)
        };
    }
}

/**
 * Common packages presets
 */
export const PACKAGE_PRESETS = {
    python: {
        datascience: ['numpy', 'pandas', 'matplotlib'],
        ml: ['scikit-learn', 'scipy'],
        web: ['requests', 'beautifulsoup4'],
        testing: ['pytest']
    },
    javascript: {
        utils: ['lodash', 'date-fns', 'ramda'],
        ui: ['react', 'vue', 'preact'],
        data: ['axios', 'ky']
    }
};

/**
 * Install a preset of packages
 */
export async function installPreset(
    language: 'python' | 'javascript',
    preset: string
): Promise<PackageInstallResult> {
    const languagePresets = PACKAGE_PRESETS[language];
    const packages = languagePresets[preset as keyof typeof languagePresets] as string[] | undefined;

    if (!packages || !Array.isArray(packages)) {
        return {
            success: false,
            message: `Preset '${preset}' not found for ${language}`,
            error: 'Invalid preset name'
        };
    }

    if (language === 'python') {
        return installPythonPackages(packages);
    } else {
        const results = await Promise.all(
            packages.map((pkg: string) => loadJavaScriptPackage(pkg))
        );

        const installed = results.filter((r: PackageInstallResult) => r.success).flatMap((r: PackageInstallResult) => r.installedPackages || []);
        const errors = results.filter((r: PackageInstallResult) => !r.success).map((r: PackageInstallResult) => r.error).join('; ');

        return {
            success: errors.length === 0,
            message: `Installed ${installed.length}/${packages.length} packages`,
            installedPackages: installed,
            error: errors || undefined
        };
    }
}
