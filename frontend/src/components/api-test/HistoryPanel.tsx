import React, { useEffect, useState } from 'react';

export interface HistoryItem {
    _id: string;
    method: string;
    url: string;
    status: number;
    time: number;
    executedAt: string;
}

interface HistoryPanelProps {
    onSelect: (item: HistoryItem) => void;
    historyItems: HistoryItem[];
}

export default function HistoryPanel({ onSelect, historyItems }: HistoryPanelProps) {
    return (
        <div className="flex flex-col h-full bg-[#252526] text-[#cccccc]">
            <div className="p-3 border-b border-[#3e3e42] font-semibold text-xs tracking-wider">
                HISTORY
            </div>
            <div className="flex-1 overflow-y-auto">
                {historyItems.map((item) => (
                    <div
                        key={item._id}
                        onClick={() => onSelect(item)}
                        className="flex flex-col px-4 py-2 border-b border-[#3e3e42] hover:bg-[#2a2d2e] cursor-pointer"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold ${getMethodColor(item.method)}`}>{item.method}</span>
                            <span className="text-xs truncate flex-1 opacity-80" title={item.url}>{item.url}</span>
                        </div>
                        <div className="flex justify-between text-[10px] opacity-60">
                            <span className={item.status >= 200 && item.status < 300 ? 'text-green-400' : 'text-red-400'}>
                                {item.status}
                            </span>
                            <span>{item.time}ms</span>
                            <span>{new Date(item.executedAt).toLocaleTimeString()}</span>
                        </div>
                    </div>
                ))}
                {historyItems.length === 0 && (
                    <div className="p-4 text-center text-xs opacity-50">No history yet</div>
                )}
            </div>
        </div>
    );
}

function getMethodColor(method: string) {
    switch (method) {
        case 'GET': return 'text-green-500';
        case 'POST': return 'text-yellow-500';
        case 'PUT': return 'text-blue-500';
        case 'DELETE': return 'text-red-500';
        default: return 'text-gray-500';
    }
}
