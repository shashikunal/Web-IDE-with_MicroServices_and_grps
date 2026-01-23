import React, { useState, useEffect } from 'react';
import CollectionsSidebar, { Collection, RequestItem } from './CollectionsSidebar';
import RequestEditor from './RequestEditor';
import ResponseViewer from './ResponseViewer';
import HistoryPanel, { HistoryItem } from './HistoryPanel';
import { History, LayoutList, Settings, Save } from 'lucide-react';
import axios from 'axios';

// Inline simple UUID generator fallback
const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Types
export interface Environment {
    id: string;
    name: string;
    variables: Record<string, string>;
}

export default function ApiTestPanel() {
    const [activeRequest, setActiveRequest] = useState<any>({
        method: 'GET',
        url: '',
        headers: [], // Changed to array for key-value editor
        bodyType: 'json',
        body: '',
        formData: [],
        auth: { type: 'noauth' },
        testScript: ''
    });

    const [response, setResponse] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [sidebarMode, setSidebarMode] = useState<'collections' | 'history'>('collections');

    // State
    const [collections, setCollections] = useState<Collection[]>([]);
    const [requests, setRequests] = useState<RequestItem[]>([]);
    const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [activeEnvId, setActiveEnvId] = useState<string | null>(null);

    // Get auth token for API calls
    const getAuthHeaders = () => {
        const token = localStorage.getItem('accessToken');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const headers = getAuthHeaders();

            const [colRes, histRes, envRes] = await Promise.all([
                axios.get('http://localhost:3000/api/apitest/collections', { headers }),
                axios.get('http://localhost:3000/api/apitest/history', { headers }),
                axios.get('http://localhost:3000/api/apitest/environments', { headers })
            ]);

            setCollections(colRes.data.collections || []);
            setRequests(colRes.data.requests || []);
            setHistoryItems(histRes.data.history || []);

            const envs = envRes.data.environments || [];
            if (envs.length === 0) {
                // Create default environment
                const defaultEnv = { id: 'default', name: 'Global', variables: { baseUrl: 'http://localhost:3000' } };
                setEnvironments([defaultEnv]);
                setActiveEnvId('default');
            } else {
                setEnvironments(envs);
                setActiveEnvId(envs[0]._id || envs[0].id);
            }

        } catch (e) {
            console.error('Failed to load API test data', e);
        }
    };

    // Variable Substitution
    const substituteVariables = (text: string) => {
        if (!text || typeof text !== 'string') return text;
        const env = environments.find(e => (e.id === activeEnvId || (e as any)._id === activeEnvId));
        if (!env) return text;

        let vars = env.variables;
        // Handle Map coming from backend? Axios usually converts Map to Object if JSON
        // Our backend schema has `variables: { type: Map, of: String }` which mongoose output as object usually.

        return text.replace(/\{\{(.*?)\}\}/g, (match, key) => {
            return (vars as any)[key.trim()] || match;
        });
    };

    const handleRun = async () => {
        setIsLoading(true);
        setResponse(null);

        try {
            const finalUrl = substituteVariables(activeRequest.url);
            const headers: Record<string, string> = {};
            if (Array.isArray(activeRequest.headers)) {
                activeRequest.headers.forEach((h: any) => {
                    if (h.key && h.enabled !== false) headers[h.key] = substituteVariables(h.value);
                });
            }

            let data: any = undefined;
            // ... (body construction logic same as before) ...
            if (activeRequest.method !== 'GET' && activeRequest.method !== 'HEAD') {
                if (activeRequest.bodyType === 'json') {
                    try {
                        data = JSON.parse(substituteVariables(activeRequest.body) || '{}');
                    } catch (e) {
                        data = activeRequest.body;
                    }
                } else if (activeRequest.bodyType === 'form-data') {
                    // Start of FormData Logic
                    const fd = new FormData();
                    if (Array.isArray(activeRequest.formData)) {
                        activeRequest.formData.forEach((item: any) => {
                            if (item.enabled !== false) {
                                if (item.type === 'file') {
                                    // Browser limitation: Can't easily persist file uploads across saves or proxy without actual file object
                                    // For now skip or assume executing locally in browser context if proxy not used
                                } else {
                                    fd.append(item.key, substituteVariables(item.value));
                                }
                            }
                        });
                    }
                    data = fd;
                } else if (activeRequest.bodyType === 'x-www-form-urlencoded') {
                    const params = new URLSearchParams();
                    if (Array.isArray(activeRequest.formData)) {
                        activeRequest.formData.forEach((item: any) => {
                            if (item.enabled !== false) params.append(item.key, substituteVariables(item.value));
                        });
                    }
                    data = params;
                }
            }

            // Execute locally (browser) or via proxy?
            // User requested "storage" in mongod, didn't explicitly say execution must be proxy-only.
            // But usually persistent clients use proxy to avoid CORS.
            // Let's try direct first for speed/simplicity, logic remains same.

            const startTime = Date.now();
            const res = await axios({
                method: activeRequest.method,
                url: finalUrl,
                headers,
                data,
                validateStatus: () => true
            });
            const endTime = Date.now();

            const responseData = {
                status: res.status,
                statusText: res.statusText,
                headers: res.headers,
                data: res.data,
                time: endTime - startTime,
                size: JSON.stringify(res.data).length,
            };

            setResponse(responseData);

            // Add to history (Backend)
            const historyEntry = {
                method: activeRequest.method,
                url: finalUrl,
                status: res.status,
                time: endTime - startTime,
                executedAt: new Date().toISOString()
            };

            // Optimistic update
            setHistoryItems(prev => [{ ...historyEntry, _id: generateUUID() } as any, ...prev].slice(0, 50));
            // Save to DB
            try {
                const headers = getAuthHeaders();
                await axios.post('http://localhost:3000/api/apitest/history', historyEntry, { headers });
            } catch (histErr) {
                console.error('Failed to save history:', histErr);
            }

        } catch (err: any) {
            setResponse({
                error: true,
                message: err.message,
                data: err.response?.data
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateCollection = async (name: string) => {
        try {
            const headers = getAuthHeaders();
            const res = await axios.post(
                'http://localhost:3000/api/apitest/collections',
                { name, parentId: null },
                { headers }
            );
            setCollections([...collections, res.data.collection]);
        } catch (e) {
            console.error('Failed to create collection:', e);
        }
    };

    const handleCreateRequest = async (collectionId: string) => {
        const newReq = {
            collectionId,
            name: 'New Request',
            method: 'GET',
            url: '',
            headers: [],
            bodyType: 'json',
            body: '',
            formData: [],
            auth: { type: 'noauth' },
            testScript: ''
        };
        try {
            const headers = getAuthHeaders();
            const res = await axios.post(
                'http://localhost:3000/api/apitest/requests',
                newReq,
                { headers }
            );
            setRequests([...requests, res.data.request]);
            setActiveRequest(res.data.request);
        } catch (e) {
            console.error('Failed to create request:', e);
        }
    };

    const handleDeleteCollection = async (id: string) => {
        try {
            const headers = getAuthHeaders();
            await axios.delete(`http://localhost:3000/api/apitest/collections/${id}`, { headers });
            setCollections(collections.filter(c => c._id !== id));
            setRequests(requests.filter(r => r.collectionId !== id));
        } catch (e) {
            console.error('Failed to delete collection:', e);
        }
    };

    const handleDeleteRequest = async (id: string) => {
        try {
            const headers = getAuthHeaders();
            await axios.delete(`http://localhost:3000/api/apitest/requests/${id}`, { headers });
            setRequests(requests.filter(r => r._id !== id));
        } catch (e) {
            console.error('Failed to delete request:', e);
        }
    };

    // Save current active request (Update)
    const handleSaveRequest = async () => {
        if (!activeRequest._id || !requests.find(r => r._id === activeRequest._id)) {
            console.log('Request not found in list, cannot save');
            return;
        }

        try {
            const headers = getAuthHeaders();
            const res = await axios.put(
                `http://localhost:3000/api/apitest/requests/${activeRequest._id}`,
                activeRequest,
                { headers }
            );
            // Update list
            setRequests(requests.map(r => r._id === res.data.request._id ? res.data.request : r));
            alert('Request saved successfully!');
        } catch (e) {
            console.error('Failed to save request:', e);
            alert('Failed to save request');
        }
    };

    return (
        <div className="flex h-full w-full bg-[#1e1e1e] text-[#cccccc] font-sans">
            {/* Sidebar */}
            <div className="w-64 border-r border-[#3e3e42] flex flex-col bg-[#252526]">
                <div className="flex border-b border-[#3e3e42] bg-[#2d2d2d]">
                    <div className="flex-1 flex">
                        <button
                            onClick={() => setSidebarMode('collections')}
                            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 ${sidebarMode === 'collections' ? 'border-[#007acc] text-white bg-[#1e1e1e]' : 'border-transparent text-gray-400 hover:text-white'}`}
                        >
                            <LayoutList size={14} /> Collections
                        </button>
                        <button
                            onClick={() => setSidebarMode('history')}
                            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 ${sidebarMode === 'history' ? 'border-[#007acc] text-white bg-[#1e1e1e]' : 'border-transparent text-gray-400 hover:text-white'}`}
                        >
                            <History size={14} /> History
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden relative">
                    {sidebarMode === 'history' ? (
                        <HistoryPanel
                            historyItems={historyItems}
                            onSelect={(item) => {
                                setActiveRequest((prev: any) => ({ ...prev, method: item.method, url: item.url }));
                            }}
                        />
                    ) : (
                        <CollectionsSidebar
                            collections={collections}
                            requests={requests}
                            onSelectRequest={(req) => {
                                // req comes from the requests state which contains full DB objects
                                // We must ensure we set the active request to this full object
                                // Also ensure any missing fields are defaulted
                                setActiveRequest({
                                    ...req,
                                    // Ensure defaults if DB has missing fields
                                    headers: req.headers || [],
                                    formData: req.formData || [],
                                    body: req.body || '',
                                    bodyType: req.bodyType || 'json',
                                    auth: req.auth || { type: 'noauth' },
                                    testScript: req.testScript || '',
                                    url: req.url || ''
                                });
                            }}
                            onCreateCollection={handleCreateCollection}
                            onCreateRequest={handleCreateRequest}
                            onDeleteCollection={handleDeleteCollection}
                            onDeleteRequest={handleDeleteRequest}
                        />
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
                <div className="h-3/5 min-h-[400px] border-b border-[#3e3e42] flex flex-col">
                    <RequestEditor
                        request={activeRequest}
                        onChange={setActiveRequest}
                        onRun={handleRun}
                        onSave={handleSaveRequest}
                        isLoading={isLoading}
                        environments={environments}
                        activeEnvId={activeEnvId}
                        onEnvChange={setActiveEnvId}
                    />
                </div>
                <div className="h-2/5 min-h-[200px]">
                    <ResponseViewer response={response} />
                </div>
            </div>
        </div>
    );
}
