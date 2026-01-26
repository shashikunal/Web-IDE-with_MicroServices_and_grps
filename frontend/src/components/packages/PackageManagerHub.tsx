/**
 * Package Manager Hub
 * Unified interface for managing packages across all languages
 * LeetCode-style clean UI
 */

import React, { useState } from 'react';
import { Package, X } from 'lucide-react';
import PythonPackageManager from './PythonPackageManager';
import JavaScriptPackageManager from './JavaScriptPackageManager';

interface PackageManagerHubProps {
    initialLanguage?: 'python' | 'javascript';
    onClose?: () => void;
}

export default function PackageManagerHub({ initialLanguage = 'python', onClose }: PackageManagerHubProps) {
    const [activeTab, setActiveTab] = useState<'python' | 'javascript'>(initialLanguage);

    const tabs = [
        { id: 'python' as const, name: 'Python', icon: '🐍', color: '#3776ab' },
        { id: 'javascript' as const, name: 'JavaScript', icon: '📦', color: '#f7df1e' },
    ];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1e1e1e] border border-[#3e3e42] rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#3e3e42] bg-[#252526]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3776ab]/20 to-[#f7df1e]/20 flex items-center justify-center">
                            <Package className="text-white" size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Package Manager</h2>
                            <p className="text-xs text-[#858585]">Manage libraries and dependencies</p>
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

                {/* Tabs */}
                <div className="flex border-b border-[#3e3e42] bg-[#252526]">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 px-4 py-3 text-sm font-medium transition-all relative ${activeTab === tab.id
                                ? 'text-white'
                                : 'text-[#858585] hover:text-white'
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-lg">{tab.icon}</span>
                                <span>{tab.name}</span>
                            </div>
                            {activeTab === tab.id && (
                                <div
                                    className="absolute bottom-0 left-0 right-0 h-0.5"
                                    style={{ backgroundColor: tab.color }}
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                    {activeTab === 'python' && <PythonPackageManager onClose={undefined} />}
                    {activeTab === 'javascript' && <JavaScriptPackageManager onClose={undefined} />}
                </div>
            </div>
        </div>
    );
}
