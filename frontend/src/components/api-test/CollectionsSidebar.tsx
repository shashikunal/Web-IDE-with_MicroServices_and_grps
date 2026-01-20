import React, { useState } from 'react';
import { Folder, FolderOpen, FileJson, Plus, MoreVertical, Trash2, Edit2 } from 'lucide-react';

export interface Collection {
    _id: string;
    name: string;
    parentId: string | null;
}

export interface RequestItem {
    _id: string;
    name: string;
    method: string;
    collectionId: string;
    url?: string;
    headers?: any[];
    bodyType?: string;
    body?: string;
    formData?: any[];
    auth?: any;
    testScript?: string;
}

interface CollectionsSidebarProps {
    collections: Collection[];
    requests: RequestItem[];
    onSelectRequest: (req: RequestItem) => void;
    onCreateCollection: (name: string) => void;
    onCreateRequest: (collectionId: string) => void;
    onDeleteCollection: (id: string) => void;
    onDeleteRequest: (id: string) => void;
}

export default function CollectionsSidebar({
    collections,
    requests,
    onSelectRequest,
    onCreateCollection,
    onCreateRequest,
    onDeleteCollection,
    onDeleteRequest
}: CollectionsSidebarProps) {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const toggleExpand = (id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="flex flex-col h-full bg-[#252526] text-[#cccccc] select-none">
            <div className="flex items-center justify-between p-3 border-b border-[#3e3e42]">
                <span className="font-semibold text-xs tracking-wider">COLLECTIONS</span>
                <button
                    onClick={() => {
                        const name = prompt('Enter collection name:', 'New Collection');
                        if (name) onCreateCollection(name);
                    }}
                    className="p-1 hover:bg-[#3e3e42] rounded"
                    title="New Collection"
                >
                    <Plus size={14} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {collections.length === 0 && (
                    <div className="p-4 text-center text-xs opacity-50">
                        No collections. Create one to start.
                    </div>
                )}
                {collections.map(col => (
                    <div key={col._id}>
                        <div
                            className="group flex items-center px-4 py-1 cursor-pointer hover:bg-[#2a2d2e]"
                            onClick={() => toggleExpand(col._id)}
                        >
                            <span className="mr-2">
                                {expanded[col._id] ? <FolderOpen size={14} /> : <Folder size={14} />}
                            </span>
                            <span className="flex-1 truncate text-sm">{col.name}</span>
                            <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onCreateRequest(col._id); }}
                                    className="p-0.5 hover:text-white"
                                    title="Add Request"
                                >
                                    <Plus size={12} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDeleteCollection(col._id); }}
                                    className="p-0.5 hover:text-red-400"
                                    title="Delete"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>

                        {expanded[col._id] && (
                            <div>
                                {requests.filter(r => r.collectionId === col._id).map(req => (
                                    <div
                                        key={req._id}
                                        className="group flex items-center pl-8 pr-4 py-1 cursor-pointer hover:bg-[#2a2d2e]"
                                        onClick={() => onSelectRequest(req)}
                                    >
                                        <span className={`text-[10px] w-8 font-bold ${getMethodColor(req.method)}`}>
                                            {req.method}
                                        </span>
                                        <span className="flex-1 truncate text-sm opacity-90">{req.name}</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDeleteRequest(req._id); }}
                                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
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
