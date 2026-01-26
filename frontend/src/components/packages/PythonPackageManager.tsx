/**
 * Python Package Manager Component
 * UI for managing Python packages via micropip (Pyodide)
 */

import React, { useState, useEffect } from 'react';
import { Package, Plus, X, Check, AlertCircle, Loader2, Search } from 'lucide-react';
import {
    installPythonPackage,
    installPythonPackages,
    listPythonPackages,
    installPreset,
    PACKAGE_PRESETS
} from '../../utils/wasm/packageManager';

interface PythonPackageManagerProps {
    onClose?: () => void;
}

export default function PythonPackageManager({ onClose }: PythonPackageManagerProps) {
    const [installedPackages, setInstalledPackages] = useState<string[]>([]);
    const [packageName, setPackageName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        refreshPackageList();
    }, []);

    const refreshPackageList = async () => {
        try {
            const packages = await listPythonPackages();
            setInstalledPackages(packages);
        } catch (err) {
            console.error('Failed to list packages:', err);
        }
    };

    const handleInstallPackage = async () => {
        if (!packageName.trim()) {
            setError('Please enter a package name');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await installPythonPackage(packageName.trim());
            if (result.success) {
                setSuccess(result.message);
                setPackageName('');
                await refreshPackageList();
            } else {
                setError(result.error || 'Installation failed');
            }
        } catch (err: any) {
            setError(err.message || 'Installation failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInstallPreset = async (preset: string) => {
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await installPreset('python', preset);
            if (result.success) {
                setSuccess(result.message);
                await refreshPackageList();
            } else {
                setError(result.error || 'Installation failed');
            }
        } catch (err: any) {
            setError(err.message || 'Installation failed');
        } finally {
            setIsLoading(false);
        }
    };

    const presets = PACKAGE_PRESETS.python;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1e1e1e] border border-[#3e3e42] rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#3e3e42] bg-[#252526]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#3776ab]/20 flex items-center justify-center">
                            <Package className="text-[#3776ab]" size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Python Packages</h2>
                            <p className="text-xs text-[#858585]">Manage packages via micropip</p>
                        </div>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-[#858585] hover:text-white transition-colors p-1"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Status Messages */}
                    {error && (
                        <div className="p-3 bg-[#f48771]/10 border border-[#f48771]/30 rounded-lg flex items-center gap-2 text-[#f48771] text-sm">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="p-3 bg-[#4ec9b0]/10 border border-[#4ec9b0]/30 rounded-lg flex items-center gap-2 text-[#4ec9b0] text-sm">
                            <Check size={16} />
                            <span>{success}</span>
                        </div>
                    )}

                    {/* Install Package */}
                    <div className="bg-[#252526] rounded-lg border border-[#3e3e42] p-4">
                        <h3 className="text-sm font-semibold text-white mb-3">Install Package</h3>
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#858585]" size={16} />
                                <input
                                    type="text"
                                    value={packageName}
                                    onChange={(e) => setPackageName(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleInstallPackage()}
                                    placeholder="Package name (e.g., numpy, pandas)"
                                    className="w-full pl-10 pr-3 py-2 bg-[#1e1e1e] border border-[#3e3e42] rounded-lg text-white text-sm focus:outline-none focus:border-[#3776ab] placeholder-[#858585]"
                                    disabled={isLoading}
                                />
                            </div>
                            <button
                                onClick={handleInstallPackage}
                                disabled={isLoading || !packageName.trim()}
                                className="px-4 py-2 bg-[#3776ab] hover:bg-[#2d5d8c] disabled:bg-[#3776ab]/50 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Installing...
                                    </>
                                ) : (
                                    <>
                                        <Plus size={16} />
                                        Install
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Presets */}
                    <div className="bg-[#252526] rounded-lg border border-[#3e3e42] p-4">
                        <h3 className="text-sm font-semibold text-white mb-3">Quick Install Presets</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(presets).map(([name, packages]) => (
                                <button
                                    key={name}
                                    onClick={() => handleInstallPreset(name)}
                                    disabled={isLoading}
                                    className="p-3 bg-[#1e1e1e] border border-[#3e3e42] hover:border-[#3776ab] rounded-lg text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                    <div className="text-sm font-medium text-white capitalize mb-1">{name}</div>
                                    <div className="text-xs text-[#858585]">{packages.join(', ')}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Installed Packages */}
                    <div className="bg-[#252526] rounded-lg border border-[#3e3e42] p-4">
                        <h3 className="text-sm font-semibold text-white mb-3">
                            Installed Packages ({installedPackages.length})
                        </h3>
                        {installedPackages.length === 0 ? (
                            <div className="text-center py-8 text-[#858585]">
                                <Package size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No packages installed yet</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                {installedPackages.map((pkg, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-2 p-2 bg-[#1e1e1e] rounded border border-[#3e3e42]"
                                    >
                                        <Check className="text-[#4ec9b0]" size={14} />
                                        <span className="text-sm text-white">{pkg}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Usage Example */}
                    <div className="bg-[#252526] rounded-lg border border-[#3e3e42] p-4">
                        <h3 className="text-sm font-semibold text-white mb-2">Usage Example</h3>
                        <pre className="text-xs text-[#858585] bg-[#1e1e1e] p-3 rounded border border-[#3e3e42] overflow-x-auto">
                            {`# After installing numpy
import numpy as np

arr = np.array([1, 2, 3, 4, 5])
print(f"Mean: {arr.mean()}")
print(f"Sum: {arr.sum()}")`}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}
