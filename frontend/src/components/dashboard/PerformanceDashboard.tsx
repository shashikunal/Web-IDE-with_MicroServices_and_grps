/**
 * Performance Dashboard Component
 * Displays execution metrics and runtime statistics
 */

import React, { useState, useEffect } from 'react';
import { Activity, Zap, Clock, TrendingUp, Download } from 'lucide-react';
import { getPreloadProgress, runtimePreloader, type PreloadProgress } from '../../utils/wasm/preloader';

interface ExecutionMetric {
    language: string;
    timestamp: number;
    executionTime: number;
    success: boolean;
    codeLength: number;
}

interface PerformanceDashboardProps {
    metrics: ExecutionMetric[];
    onClose?: () => void;
}

export default function PerformanceDashboard({ metrics, onClose }: PerformanceDashboardProps) {
    const [preloadProgress, setPreloadProgress] = useState<PreloadProgress[]>([]);
    const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

    useEffect(() => {
        // Subscribe to preload progress updates
        const unsubscribe = runtimePreloader.onProgress(setPreloadProgress);

        // Get initial progress
        setPreloadProgress(getPreloadProgress());

        return unsubscribe;
    }, []);

    // Calculate statistics
    const stats = React.useMemo(() => {
        const languageStats = new Map<string, {
            count: number;
            totalTime: number;
            avgTime: number;
            minTime: number;
            maxTime: number;
            successRate: number;
        }>();

        metrics.forEach(metric => {
            const existing = languageStats.get(metric.language) || {
                count: 0,
                totalTime: 0,
                avgTime: 0,
                minTime: Infinity,
                maxTime: 0,
                successRate: 0
            };

            existing.count++;
            existing.totalTime += metric.executionTime;
            existing.minTime = Math.min(existing.minTime, metric.executionTime);
            existing.maxTime = Math.max(existing.maxTime, metric.executionTime);

            languageStats.set(metric.language, existing);
        });

        // Calculate averages and success rates
        languageStats.forEach((stats, lang) => {
            stats.avgTime = stats.totalTime / stats.count;
            const successes = metrics.filter(m => m.language === lang && m.success).length;
            stats.successRate = (successes / stats.count) * 100;
        });

        return languageStats;
    }, [metrics]);

    const totalExecutions = metrics.length;
    const avgExecutionTime = metrics.reduce((sum, m) => sum + m.executionTime, 0) / (totalExecutions || 1);
    const successRate = (metrics.filter(m => m.success).length / (totalExecutions || 1)) * 100;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1e1e1e] border border-[#3e3e42] rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#3e3e42]">
                    <div className="flex items-center gap-3">
                        <Activity className="text-[#4ec9b0]" size={24} />
                        <h2 className="text-xl font-semibold text-white">Performance Dashboard</h2>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-[#858585] hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {/* Overview Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-[#252526] p-4 rounded-lg border border-[#3e3e42]">
                            <div className="flex items-center gap-2 mb-2">
                                <Zap className="text-[#dcdcaa]" size={20} />
                                <span className="text-sm text-[#858585]">Total Executions</span>
                            </div>
                            <div className="text-2xl font-bold text-white">{totalExecutions}</div>
                        </div>

                        <div className="bg-[#252526] p-4 rounded-lg border border-[#3e3e42]">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="text-[#4ec9b0]" size={20} />
                                <span className="text-sm text-[#858585]">Avg Execution Time</span>
                            </div>
                            <div className="text-2xl font-bold text-white">{avgExecutionTime.toFixed(2)}ms</div>
                        </div>

                        <div className="bg-[#252526] p-4 rounded-lg border border-[#3e3e42]">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="text-[#4fc1ff]" size={20} />
                                <span className="text-sm text-[#858585]">Success Rate</span>
                            </div>
                            <div className="text-2xl font-bold text-white">{successRate.toFixed(1)}%</div>
                        </div>
                    </div>

                    {/* Language Statistics */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Language Performance</h3>
                        <div className="space-y-3">
                            {Array.from(stats.entries()).map(([language, langStats]) => (
                                <div
                                    key={language}
                                    className="bg-[#252526] p-4 rounded-lg border border-[#3e3e42] cursor-pointer hover:border-[#007acc] transition-colors"
                                    onClick={() => setSelectedLanguage(language === selectedLanguage ? null : language)}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-white capitalize">{language}</span>
                                        <span className="text-sm text-[#858585]">{langStats.count} executions</span>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <div className="text-[#858585]">Avg Time</div>
                                            <div className="text-[#4ec9b0] font-medium">{langStats.avgTime.toFixed(2)}ms</div>
                                        </div>
                                        <div>
                                            <div className="text-[#858585]">Min Time</div>
                                            <div className="text-[#4ec9b0] font-medium">{langStats.minTime.toFixed(2)}ms</div>
                                        </div>
                                        <div>
                                            <div className="text-[#858585]">Max Time</div>
                                            <div className="text-[#4ec9b0] font-medium">{langStats.maxTime.toFixed(2)}ms</div>
                                        </div>
                                        <div>
                                            <div className="text-[#858585]">Success Rate</div>
                                            <div className="text-[#4ec9b0] font-medium">{langStats.successRate.toFixed(1)}%</div>
                                        </div>
                                    </div>

                                    {selectedLanguage === language && (
                                        <div className="mt-4 pt-4 border-t border-[#3e3e42]">
                                            <div className="text-sm text-[#858585] mb-2">Recent Executions</div>
                                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                                {metrics
                                                    .filter(m => m.language === language)
                                                    .slice(-5)
                                                    .reverse()
                                                    .map((m, i) => (
                                                        <div key={i} className="flex items-center justify-between text-xs">
                                                            <span className={m.success ? 'text-[#4ec9b0]' : 'text-[#f48771]'}>
                                                                {m.success ? '✓' : '✗'} {new Date(m.timestamp).toLocaleTimeString()}
                                                            </span>
                                                            <span className="text-[#858585]">{m.executionTime.toFixed(2)}ms</span>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Runtime Preload Status */}
                    {preloadProgress.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Download size={20} />
                                Runtime Preload Status
                            </h3>
                            <div className="space-y-2">
                                {preloadProgress.map(progress => (
                                    <div key={progress.language} className="bg-[#252526] p-3 rounded-lg border border-[#3e3e42]">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-white capitalize">{progress.language}</span>
                                            <span className={`text-xs px-2 py-1 rounded ${progress.status === 'ready' ? 'bg-[#4ec9b0]/20 text-[#4ec9b0]' :
                                                    progress.status === 'loading' ? 'bg-[#dcdcaa]/20 text-[#dcdcaa]' :
                                                        progress.status === 'error' ? 'bg-[#f48771]/20 text-[#f48771]' :
                                                            'bg-[#858585]/20 text-[#858585]'
                                                }`}>
                                                {progress.status}
                                            </span>
                                        </div>

                                        <div className="w-full bg-[#3e3e42] rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all ${progress.status === 'ready' ? 'bg-[#4ec9b0]' :
                                                        progress.status === 'error' ? 'bg-[#f48771]' :
                                                            'bg-[#dcdcaa]'
                                                    }`}
                                                style={{ width: `${progress.progress}%` }}
                                            />
                                        </div>

                                        {progress.error && (
                                            <div className="mt-2 text-xs text-[#f48771]">{progress.error}</div>
                                        )}

                                        {progress.endTime && progress.startTime && (
                                            <div className="mt-2 text-xs text-[#858585]">
                                                Loaded in {((progress.endTime - progress.startTime) / 1000).toFixed(2)}s
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
