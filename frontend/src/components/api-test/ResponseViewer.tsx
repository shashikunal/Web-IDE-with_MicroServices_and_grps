import React, { useState } from 'react';
import Editor from '@monaco-editor/react';

interface TestResult {
    name: string;
    status: 'pass' | 'fail';
    error?: string;
}

interface ApiResponse {
    status: number;
    statusText: string;
    time: number;
    size: number;
    data: any;
    headers: any;
    testResults?: { tests: TestResult[]; logs: string[] };
    error?: boolean;
    message?: string;
}

interface ResponseViewerProps {
    response: ApiResponse | null;
}

export default function ResponseViewer({ response }: ResponseViewerProps) {
    const [activeTab, setActiveTab] = useState<'body' | 'headers' | 'tests'>('body');

    if (!response) {
        return (
            <div className="flex-1 flex items-center justify-center text-gray-500 bg-[#1e1e1e] h-full">
                Send a request to see the response here
            </div>
        );
    }

    if (response.error) {
        return (
            <div className="flex-1 p-4 bg-[#1e1e1e] h-full text-red-400">
                <h3 className="font-bold mb-2">Error</h3>
                <pre>{response.message}</pre>
                {response.data && <pre className="mt-2 text-xs">{JSON.stringify(response.data, null, 2)}</pre>}
            </div>
        );
    }

    const isJson = typeof response.data === 'object';
    const bodyContent = isJson ? JSON.stringify(response.data, null, 2) : String(response.data);

    // Status Color
    const statusColor = response.status >= 200 && response.status < 300 ? 'text-green-500' : 'text-red-500';

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] border-t border-[#3e3e42]">
            {/* Meta Bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#3e3e42] bg-[#252526]">
                <div className="flex gap-4 text-sm">
                    <div>Status: <span className={`font-mono font-bold ${statusColor}`}>{response.status} {response.statusText}</span></div>
                    <div>Time: <span className="font-mono text-green-500">{response.time}ms</span></div>
                    <div>Size: <span className="font-mono text-green-500">{response.size} B</span></div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#3e3e42]">
                {['Body', 'Headers', 'Tests'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab.toLowerCase() as any)}
                        className={`px-4 py-1 text-sm border-b-2 transition-colors ${activeTab === tab.toLowerCase()
                                ? 'border-[#007acc] text-white'
                                : 'border-transparent text-gray-400 hover:text-white'
                            }`}
                    >
                        {tab}
                        {tab === 'Tests' && response.testResults?.tests?.length ? ` (${response.testResults.tests.length})` : ''}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'body' && (
                    <Editor
                        height="100%"
                        defaultLanguage={isJson ? 'json' : 'text'}
                        theme="vs-dark"
                        value={bodyContent}
                        options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13 }}
                    />
                )}

                {activeTab === 'headers' && (
                    <div className="p-4 overflow-auto h-full text-sm text-[#cccccc]">
                        {Object.entries(response.headers).map(([k, v]) => (
                            <div key={k} className="grid grid-cols-3 gap-2 py-1 border-b border-[#333]">
                                <span className="font-bold truncate">{k}</span>
                                <span className="col-span-2 break-all">{String(v)}</span>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'tests' && (
                    <div className="p-4 overflow-auto h-full">
                        {response.testResults?.tests.length === 0 && <div className="text-gray-500">No tests executed.</div>}

                        <div className="flex flex-col gap-2">
                            {response.testResults?.tests.map((test, i) => (
                                <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded ${test.status === 'pass' ? 'bg-[#1e3a1e] text-green-300' : 'bg-[#3a1e1e] text-red-300'
                                    }`}>
                                    <span className="font-bold">{test.status === 'pass' ? 'PASS' : 'FAIL'}</span>
                                    <span>{test.name}</span>
                                    {test.error && <span className="text-xs opacity-70 ml-auto">{test.error}</span>}
                                </div>
                            ))}
                        </div>

                        {response.testResults?.logs?.length ? (
                            <div className="mt-4 border-t border-[#3e3e42] pt-2">
                                <h4 className="text-xs font-bold text-gray-400 mb-2">CONSOLE LOGS</h4>
                                <div className="font-mono text-xs text-gray-300">
                                    {response.testResults.logs.map((log, i) => (
                                        <div key={i}>{log}</div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    );
}
