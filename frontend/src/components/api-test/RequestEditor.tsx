import React, { useState, useEffect } from 'react';
import AuthConfig from './AuthConfig';
import Editor from '@monaco-editor/react';
import { Plus, Trash2, Eye, EyeOff, FileText, Upload, X } from 'lucide-react';
import { Environment } from './ApiTestPanel'; // We will import from parent or define common types

// Inline UUID generator for simple needs
const generateId = () => Math.random().toString(36).substring(2, 9);

interface KeyValueItem {
    id: string;
    key: string;
    value: string;
    enabled: boolean;
    type?: 'text' | 'file'; // For form-data
    files?: FileList | null; // For file inputs
}

// Updated RequestState interface handled dynamically in parent, but laid out here for logic
interface RequestEditorProps {
    request: any;
    onChange: (req: any) => void;
    onRun: () => void;
    isLoading?: boolean;
    environments: Environment[];
    activeEnvId: string | null;
    onEnvChange: (id: string) => void;
}

const KeyValueEditor = ({ items, onChange, type = 'params' }: { items: KeyValueItem[], onChange: (items: KeyValueItem[]) => void, type?: 'params' | 'form-data' | 'headers' }) => {

    // Ensure at least one empty row
    useEffect(() => {
        if (items.length === 0 || (items[items.length - 1].key !== '' || items[items.length - 1].value !== '')) {
            onChange([...items, { id: generateId(), key: '', value: '', enabled: true, type: 'text' }]);
        }
    }, [items, onChange]);

    const updateItem = (index: number, field: keyof KeyValueItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        onChange(newItems);
    };

    const deleteItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        onChange(newItems);
    };

    return (
        <div className="flex flex-col w-full text-sm border border-[#3e3e42] rounded-sm bg-[#1e1e1e]">
            <div className="flex border-b border-[#3e3e42] bg-[#252526] text-xs font-semibold text-gray-400">
                <div className="w-8 py-1 text-center"></div>
                <div className="flex-1 py-1 px-2 border-r border-[#3e3e42]">Key</div>
                <div className="flex-1 py-1 px-2 border-r border-[#3e3e42]">Value</div>
                {type === 'form-data' && <div className="w-20 py-1 px-2 border-r border-[#3e3e42]">Type</div>}
                <div className="w-8 py-1"></div>
            </div>
            {items.map((item, index) => (
                <div key={item.id} className="flex border-b border-[#3e3e42] last:border-0 group">
                    <div className="w-8 flex items-center justify-center border-r border-[#3e3e42]">
                        {index < items.length - 1 && (
                            <input
                                type="checkbox"
                                checked={item.enabled}
                                onChange={(e) => updateItem(index, 'enabled', e.target.checked)}
                                className="accent-[#007acc] h-3 w-3"
                            />
                        )}
                    </div>
                    <div className="flex-1 border-r border-[#3e3e42]">
                        <input
                            type="text"
                            value={item.key}
                            onChange={(e) => updateItem(index, 'key', e.target.value)}
                            placeholder="Key"
                            className="w-full bg-transparent px-2 py-1 outline-none text-[#cccccc] placeholder-gray-600"
                        />
                    </div>
                    <div className="flex-1 border-r border-[#3e3e42] relative">
                        {item.type === 'file' ? (
                            <div className="flex items-center px-2 py-1 gap-2">
                                <label className="cursor-pointer bg-[#3d3d3d] hover:bg-[#4d4d4d] text-[10px] px-2 py-0.5 rounded text-[#cccccc] flex items-center gap-1">
                                    <Upload size={10} /> Select File
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => updateItem(index, 'files', e.target.files)}
                                    />
                                </label>
                                {item.files && item.files.length > 0 ? (
                                    <span className="text-[10px] truncate text-green-400 max-w-[100px]">{item.files[0].name}</span>
                                ) : <span className="text-[10px] text-gray-600 italic">No file selected</span>}
                            </div>
                        ) : (
                            <input
                                type="text"
                                value={item.value}
                                onChange={(e) => updateItem(index, 'value', e.target.value)}
                                placeholder="Value"
                                className="w-full bg-transparent px-2 py-1 outline-none text-[#cccccc] placeholder-gray-600"
                            />
                        )}
                    </div>
                    {type === 'form-data' && (
                        <div className="w-20 border-r border-[#3e3e42]">
                            <select
                                value={item.type}
                                onChange={(e) => updateItem(index, 'type', e.target.value)}
                                className="w-full bg-[#1e1e1e] text-[#cccccc] text-[10px] outline-none border-none py-1.5 px-1"
                            >
                                <option value="text">Text</option>
                                <option value="file">File</option>
                            </select>
                        </div>
                    )}
                    <div className="w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {index < items.length - 1 && (
                            <button onClick={() => deleteItem(index)} className="text-gray-500 hover:text-red-400">
                                <X size={12} />
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default function RequestEditor({ request, onChange, onRun, isLoading, environments, activeEnvId, onEnvChange }: RequestEditorProps) {
    const [activeTab, setActiveTab] = useState<'params' | 'auth' | 'headers' | 'body' | 'tests'>('body');

    const updateField = (field: string, value: any) => {
        onChange({ ...request, [field]: value });
    };

    // Ensure FormData structure exists
    useEffect(() => {
        if (!request.formData) {
            updateField('formData', [{ id: generateId(), key: '', value: '', enabled: true, type: 'text' }]);
        }
    }, []);

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] font-sans">
            {/* Top Bar */}
            <div className="flex items-center gap-2 p-3 border-b border-[#3e3e42] bg-[#252526]">
                <div className="flex items-center gap-0.5 border border-[#3e3e42] rounded overflow-hidden">
                    <select
                        value={request.method}
                        onChange={(e) => updateField('method', e.target.value)}
                        className={`bg-[#2d2d2d] px-3 py-1.5 text-sm font-bold focus:outline-none appearance-none cursor-pointer
                            ${request.method === 'GET' ? 'text-green-500' :
                                request.method === 'POST' ? 'text-yellow-500' :
                                    request.method === 'DELETE' ? 'text-red-500' : 'text-blue-500'}`}
                        style={{ textAlignLast: 'center' }}
                    >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="PATCH">PATCH</option>
                        <option value="DELETE">DELETE</option>
                    </select>
                </div>

                <div className="flex-1 flex items-center relative">
                    <input
                        type="text"
                        value={request.url}
                        onChange={(e) => updateField('url', e.target.value)}
                        placeholder="Enter request URL (e.g., {{baseUrl}}/api/users)"
                        className="w-full bg-[#2d2d2d] border border-[#3e3e42] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#007acc] text-[#cccccc] placeholder-gray-600 font-mono"
                    />
                </div>

                <button
                    onClick={onRun}
                    disabled={isLoading}
                    className="bg-[#007acc] hover:bg-[#0062a3] text-white px-6 py-1.5 rounded text-sm font-semibold disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
                >
                    {isLoading ? 'Running...' : 'Send'}
                </button>
            </div>

            {/* Env Toolbar */}
            <div className="flex items-center justify-end px-3 py-1 bg-[#2d2d2d] border-b border-[#3e3e42]">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-gray-500">Env:</span>
                    <select
                        value={activeEnvId || ''}
                        onChange={(e) => onEnvChange(e.target.value)}
                        className="bg-[#1e1e1e] text-[#cccccc] text-xs border border-[#3e3e42] rounded px-2 py-0.5 outline-none focus:border-[#007acc]"
                    >
                        {environments.map(env => (
                            <option key={env.id} value={env.id}>{env.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#3e3e42] bg-[#252526]">
                {['Params', 'Auth', 'Headers', 'Body', 'Tests'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab.toLowerCase() as any)}
                        className={`px-4 py-2 text-xs font-semibold uppercase tracking-wide border-b-2 transition-colors ${activeTab === tab.toLowerCase()
                            ? 'border-[#f14c4c] text-white bg-[#1e1e1e]' // Postman-like orange/red highlight often used, or blue
                            : 'border-transparent text-gray-400 hover:text-white hover:bg-[#2d2d2d]'
                            }`}
                        style={{ borderColor: activeTab === tab.toLowerCase() ? '#f97316' : 'transparent' }} // Orange accent
                    >
                        {tab}
                        {tab === 'Headers' && request.headers && request.headers.length > 0 && <span className="ml-1 text-[10px] bg-gray-700 px-1 rounded-full">{request.headers.filter((h: any) => h.key && h.enabled).length}</span>}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden relative p-4 flex flex-col">

                {/* HEADERS */}
                {activeTab === 'headers' && (
                    <div className="flex-1 overflow-auto">
                        <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase">Request Headers</h3>
                        <KeyValueEditor
                            items={Array.isArray(request.headers) ? request.headers : []}
                            onChange={(items) => updateField('headers', items)}
                            type="headers"
                        />
                    </div>
                )}

                {/* BODY */}
                {activeTab === 'body' && (
                    <div className="flex flex-col h-full">
                        <div className="flex items-center gap-4 mb-4 text-xs">
                            {['none', 'form-data', 'x-www-form-urlencoded', 'json', 'raw'].map(type => (
                                <label key={type} className="flex items-center gap-1.5 cursor-pointer text-gray-300 hover:text-white">
                                    <input
                                        type="radio"
                                        name="bodyType"
                                        value={type}
                                        checked={request.bodyType === type}
                                        onChange={(e) => updateField('bodyType', e.target.value)}
                                        className="accent-[#f97316]"
                                    />
                                    <span>{type === 'x-www-form-urlencoded' ? 'x-www-form-urlencoded' : type.replace('-', ' ')}</span>
                                </label>
                            ))}
                        </div>

                        <div className="flex-1 overflow-hidden relative border border-[#3e3e42] rounded bg-[#1e1e1e]">
                            {request.bodyType === 'none' && (
                                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                                    This request does not have a body
                                </div>
                            )}

                            {(request.bodyType === 'json' || request.bodyType === 'raw') && (
                                <Editor
                                    height="100%"
                                    defaultLanguage="json"
                                    theme="vs-dark"
                                    value={request.body}
                                    onChange={(value) => updateField('body', value || '')}
                                    options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false }}
                                />
                            )}

                            {(request.bodyType === 'form-data' || request.bodyType === 'x-www-form-urlencoded') && (
                                <div className="overflow-auto h-full p-2">
                                    <KeyValueEditor
                                        items={Array.isArray(request.formData) ? request.formData : []}
                                        onChange={(items) => updateField('formData', items)}
                                        type={request.bodyType === 'form-data' ? 'form-data' : 'params'}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* AUTH */}
                {activeTab === 'auth' && (
                    <AuthConfig
                        auth={request.auth}
                        onChange={(newAuth) => updateField('auth', newAuth)}
                    />
                )}

                {/* TESTS */}
                {activeTab === 'tests' && (
                    <div className="flex flex-col h-full">
                        <div className="text-xs text-gray-400 mb-2">Write tests to execute after the request:</div>
                        <div className="flex-1 border border-[#3e3e42] rounded overflow-hidden">
                            <Editor
                                height="100%"
                                defaultLanguage="javascript"
                                theme="vs-dark"
                                value={request.testScript}
                                onChange={(value) => updateField('testScript', value || '')}
                                options={{ minimap: { enabled: false }, fontSize: 13 }}
                            />
                        </div>
                    </div>
                )}

                {/* PARAMS */}
                {activeTab === 'params' && (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-sm">
                        <p>Query Params Key-Value Editor coming soon.</p>
                        <p className="text-xs mt-2">Edit URL directly for now.</p>
                    </div>
                )}

            </div>
        </div>
    );
}
