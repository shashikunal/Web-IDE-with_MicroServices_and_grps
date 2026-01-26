/**
 * JavaScript Package Manager Component
 * UI for loading JavaScript packages from esm.sh CDN
 */

import React, { useState } from 'react';
import { Package, Plus, X, Check, AlertCircle, Loader2, Search } from 'lucide-react';
import {
    loadJavaScriptPackage,
    installPreset,
    PACKAGE_PRESETS
} from '../../utils/wasm/packageManager';

interface JavaScriptPackageManagerProps {
    onClose?: () => void;
}

export default function JavaScriptPackageManager({ onClose }: JavaScriptPackageManagerProps) {
    const [loadedPackages, setLoadedPackages] = useState<string[]>([]);
    const [packageName, setPackageName] = useState('');
    const [packageVersion, setPackageVersion] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleLoadPackage = async () => {
        if (!packageName.trim()) {
            setError('Please enter a package name');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await loadJavaScriptPackage(
                packageName.trim(),
                packageVersion.trim() || undefined
            );

            if (result.success) {
                setSuccess(result.message);
                setLoadedPackages(prev => [...prev, packageName.trim()]);
                setPackageName('');
                setPackageVersion('');
            } else {
                setError(result.error || 'Failed to load package');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load package');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoadPreset = async (preset: string) => {
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await installPreset('javascript', preset);
            if (result.success) {
                setSuccess(result.message);
                if (result.installedPackages) {
                    setLoadedPackages(prev => [...new Set([...prev, ...result.installedPackages!])]);
                }
            } else {
                setError(result.error || 'Failed to load preset');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load preset');
        } finally {
            setIsLoading(false);
        }
    };

    const presets = PACKAGE_PRESETS.javascript;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1e1e1e] border border-[#3e3e42] rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#3e3e42] bg-[#252526]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#f7df1e]/20 flex items-center justify-center">
                            <Package className="text-[#f7df1e]" size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">JavaScript Packages</h2>
                            <p className="text-xs text-[#858585]">Load packages from esm.sh CDN</p>
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

                    {/* Load Package */}
                    <div className="bg-[#252526] rounded-lg border border-[#3e3e42] p-4">
                        <h3 className="text-sm font-semibold text-white mb-3">Load Package from CDN</h3>
                        <div className="space-y-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#858585]" size={16} />
                                <input
                                    type="text"
                                    value={packageName}
                                    onChange={(e) => setPackageName(e.target.value)}
                                    placeholder="Package name (e.g., lodash, axios)"
                                    className="w-full pl-10 pr-3 py-2 bg-[#1e1e1e] border border-[#3e3e42] rounded-lg text-white text-sm focus:outline-none focus:border-[#f7df1e] placeholder-[#858585]"
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={packageVersion}
                                    onChange={(e) => setPackageVersion(e.target.value)}
                                    placeholder="Version (optional, e.g., 4.17.21)"
                                    className="flex-1 px-3 py-2 bg-[#1e1e1e] border border-[#3e3e42] rounded-lg text-white text-sm focus:outline-none focus:border-[#f7df1e] placeholder-[#858585]"
                                    disabled={isLoading}
                                />
                                <button
                                    onClick={handleLoadPackage}
                                    disabled={isLoading || !packageName.trim()}
                                    className="px-4 py-2 bg-[#f7df1e] hover:bg-[#d4c01e] disabled:bg-[#f7df1e]/50 disabled:cursor-not-allowed text-black rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={16} />
                                            Load
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Presets */}
                    <div className="bg-[#252526] rounded-lg border border-[#3e3e42] p-4">
                        <h3 className="text-sm font-semibold text-white mb-3">Quick Load Presets</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(presets).map(([name, packages]) => (
                                <button
                                    key={name}
                                    onClick={() => handleLoadPreset(name)}
                                    disabled={isLoading}
                                    className="p-3 bg-[#1e1e1e] border border-[#3e3e42] hover:border-[#f7df1e] rounded-lg text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="text-sm font-medium text-white capitalize mb-1">{name}</div>
                                    <div className="text-xs text-[#858585]">{packages.join(', ')}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Loaded Packages */}
                    <div className="bg-[#252526] rounded-lg border border-[#3e3e42] p-4">
                        <h3 className="text-sm font-semibold text-white mb-3">
                            Loaded Packages ({loadedPackages.length})
                        </h3>
                        {loadedPackages.length === 0 ? (
                            <div className="text-center py-8 text-[#858585]">
                                <Package size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No packages loaded yet</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                {loadedPackages.map((pkg, index) => (
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
                            {`// After loading lodash
const _ = window.lodash_; // Auto-assigned to window

const numbers = [1, 2, 3, 4, 5];
const doubled = _.map(numbers, n => n * 2);
console.log(doubled);`}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}
