/**
 * JAR Manager Component
 * UI for managing external JAR files in Java WASM runtime
 */

import React, { useState, useEffect } from 'react';
import { Package, Upload, X, Download, Check, AlertCircle, Info } from 'lucide-react';
import {
    getLoadedJavaJars,
    loadJavaJar,
    loadCommonJar,
    clearJavaJars,
    COMMON_JAVA_JARS
} from '../../utils/wasm/javaRunner';

interface JarManagerProps {
    onClose?: () => void;
}

export default function JarManager({ onClose }: JarManagerProps) {
    const [loadedJars, setLoadedJars] = useState<Array<{ name: string; url: string; loaded: boolean }>>([]);
    const [customJarUrl, setCustomJarUrl] = useState('');
    const [customJarName, setCustomJarName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        refreshJarList();
    }, []);

    const refreshJarList = () => {
        setLoadedJars(getLoadedJavaJars());
    };

    const handleLoadCommonJar = async (libraryName: keyof typeof COMMON_JAVA_JARS) => {
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await loadCommonJar();
            setSuccess(`Successfully loaded ${libraryName}`);
            refreshJarList();
        } catch (err: any) {
            setError(err.message || 'Failed to load JAR');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoadCustomJar = async () => {
        if (!customJarUrl.trim()) {
            setError('Please enter a JAR URL');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await loadJavaJar();
            setSuccess(`Successfully loaded custom JAR`);
            setCustomJarUrl('');
            setCustomJarName('');
            refreshJarList();
        } catch (err: any) {
            setError(err.message || 'Failed to load custom JAR');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearAll = () => {
        clearJavaJars();
        setLoadedJars([]);
        setSuccess('Cleared all JAR files');
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1e1e1e] border border-[#3e3e42] rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#3e3e42] bg-[#252526]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#f59e0b]/20 flex items-center justify-center">
                            <Package className="text-[#f59e0b]" size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Java JAR Manager</h2>
                            <p className="text-xs text-[#858585]">Note: JAR loading works best with container execution</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[#858585] hover:text-white transition-colors p-1 hover:bg-[#3e3e42] rounded"
                        title="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {/* Status Messages */}
                    {error && (
                        <div className="mb-4 p-3 bg-[#f48771]/10 border border-[#f48771]/30 rounded flex items-center gap-2 text-[#f48771]">
                            <AlertCircle size={16} />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-3 bg-[#4ec9b0]/10 border border-[#4ec9b0]/30 rounded flex items-center gap-2 text-[#4ec9b0]">
                            <Check size={16} />
                            <span className="text-sm">{success}</span>
                        </div>
                    )}

                    {/* Info Message about Maven */}
                    <div className="mb-4 p-4 bg-[#007acc]/10 border border-[#007acc]/30 rounded-lg">
                        <div className="flex items-start gap-3">
                            <Info className="text-[#007acc] mt-0.5" size={20} />
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-white mb-1">Use Maven for Java Dependencies</h4>
                                <p className="text-xs text-[#858585] mb-2">
                                    Browser-based JAR loading has CORS limitations. For the best experience, use Maven in your workspace:
                                </p>
                                <div className="bg-[#1e1e1e] p-2 rounded text-xs text-[#858585] font-mono">
                                    Add to pom.xml → Maven downloads automatically → No CORS issues!
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Loaded JARs */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-white">Loaded JARs ({loadedJars.length})</h3>
                            {loadedJars.length > 0 && (
                                <button
                                    onClick={handleClearAll}
                                    className="text-xs px-3 py-1 bg-[#f48771]/20 text-[#f48771] rounded hover:bg-[#f48771]/30 transition-colors"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>

                        {loadedJars.length === 0 ? (
                            <div className="text-center py-8 text-[#858585]">
                                <Package size={48} className="mx-auto mb-2 opacity-50" />
                                <p>No JAR files loaded</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {loadedJars.map((jar, index) => (
                                    <div
                                        key={index}
                                        className="bg-[#252526] p-3 rounded border border-[#3e3e42] flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Check className="text-[#4ec9b0]" size={16} />
                                            <div>
                                                <div className="text-white font-medium text-sm">{jar.name}</div>
                                                <div className="text-[#858585] text-xs truncate max-w-md">{jar.url}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Common Libraries */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-white mb-3">Common Libraries</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.entries(COMMON_JAVA_JARS).map(([name, url]) => {
                                const isLoaded = loadedJars.some(jar => jar.url === url);
                                return (
                                    <button
                                        key={name}
                                        onClick={() => !isLoaded && handleLoadCommonJar(name as keyof typeof COMMON_JAVA_JARS)}
                                        disabled={isLoaded || isLoading}
                                        className={`p-3 rounded border text-left transition-all ${isLoaded
                                            ? 'bg-[#4ec9b0]/10 border-[#4ec9b0]/30 cursor-default'
                                            : 'bg-[#252526] border-[#3e3e42] hover:border-[#007acc] cursor-pointer'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {isLoaded ? (
                                                    <Check className="text-[#4ec9b0]" size={16} />
                                                ) : (
                                                    <Download className="text-[#858585]" size={16} />
                                                )}
                                                <span className={`font-medium text-sm ${isLoaded ? 'text-[#4ec9b0]' : 'text-white'}`}>
                                                    {name}
                                                </span>
                                            </div>
                                            {isLoaded && (
                                                <span className="text-xs text-[#4ec9b0]">Loaded</span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Custom JAR */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Load Custom JAR</h3>
                        <div className="bg-[#252526] p-4 rounded border border-[#3e3e42]">
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm text-[#858585] mb-1">JAR URL (required)</label>
                                    <input
                                        type="text"
                                        value={customJarUrl}
                                        onChange={(e) => setCustomJarUrl(e.target.value)}
                                        placeholder="https://example.com/library.jar"
                                        className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#3e3e42] rounded text-white text-sm focus:outline-none focus:border-[#007acc]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-[#858585] mb-1">JAR Name (optional)</label>
                                    <input
                                        type="text"
                                        value={customJarName}
                                        onChange={(e) => setCustomJarName(e.target.value)}
                                        placeholder="library.jar"
                                        className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#3e3e42] rounded text-white text-sm focus:outline-none focus:border-[#007acc]"
                                    />
                                </div>

                                <button
                                    onClick={handleLoadCustomJar}
                                    disabled={isLoading || !customJarUrl.trim()}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#0e639c] hover:bg-[#1177bb] disabled:bg-[#0e639c]/50 disabled:cursor-not-allowed text-white rounded font-medium text-sm transition-colors"
                                >
                                    <Upload size={16} />
                                    {isLoading ? 'Loading...' : 'Load JAR'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Usage Example */}
                    <div className="mt-6 p-4 bg-[#252526] rounded border border-[#3e3e42]">
                        <h4 className="text-sm font-semibold text-white mb-2">Usage Example</h4>
                        <pre className="text-xs text-[#858585] overflow-x-auto">
                            {`// After loading Guava JAR:
import com.google.common.collect.ImmutableList;

public class Main {
    public static void main(String[] args) {
        ImmutableList<String> list = 
            ImmutableList.of("Hello", "from", "Guava");
        System.out.println(list);
    }
}`}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}
