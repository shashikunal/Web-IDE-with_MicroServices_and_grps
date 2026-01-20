import React from 'react';

export interface AuthState {
    type: 'noauth' | 'basic' | 'bearer' | 'apikey';
    basic?: { username?: string; password?: string };
    bearer?: { token?: string };
    apikey?: { key?: string; value?: string; in?: 'header' | 'query' };
}

interface AuthConfigProps {
    auth: AuthState;
    onChange: (auth: AuthState) => void;
}

export default function AuthConfig({ auth, onChange }: AuthConfigProps) {
    const handleChange = (field: keyof AuthState, value: any) => {
        onChange({ ...auth, [field]: value });
    };

    const updateNested = (type: 'basic' | 'bearer' | 'apikey', field: string, value: string) => {
        onChange({
            ...auth,
            [type]: {
                ...auth[type],
                [field]: value
            }
        });
    };

    return (
        <div className="p-4 text-[#cccccc]">
            <div className="flex items-center gap-4 mb-4">
                <label className="text-sm font-medium">Type</label>
                <select
                    value={auth.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    className="bg-[#3c3c3c] border border-[#3c3c3c] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#007acc]"
                >
                    <option value="noauth">No Auth</option>
                    <option value="basic">Basic Auth</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="apikey">API Key</option>
                </select>
            </div>

            {auth.type === 'noauth' && (
                <div className="text-sm text-gray-400">This request does not use any authorization.</div>
            )}

            {auth.type === 'basic' && (
                <div className="flex flex-col gap-3 max-w-md">
                    <div className="flex gap-2 items-center">
                        <label className="w-20 text-sm">Username</label>
                        <input
                            type="text"
                            value={auth.basic?.username || ''}
                            onChange={(e) => updateNested('basic', 'username', e.target.value)}
                            className="flex-1 bg-[#3c3c3c] border border-[#3c3c3c] rounded px-2 py-1 text-sm focus:outline-none"
                        />
                    </div>
                    <div className="flex gap-2 items-center">
                        <label className="w-20 text-sm">Password</label>
                        <input
                            type="password"
                            value={auth.basic?.password || ''}
                            onChange={(e) => updateNested('basic', 'password', e.target.value)}
                            className="flex-1 bg-[#3c3c3c] border border-[#3c3c3c] rounded px-2 py-1 text-sm focus:outline-none"
                        />
                    </div>
                </div>
            )}

            {auth.type === 'bearer' && (
                <div className="flex flex-col gap-3 max-w-md">
                    <div className="flex gap-2 items-center">
                        <label className="w-20 text-sm">Token</label>
                        <input
                            type="text"
                            value={auth.bearer?.token || ''}
                            onChange={(e) => updateNested('bearer', 'token', e.target.value)}
                            className="flex-1 bg-[#3c3c3c] border border-[#3c3c3c] rounded px-2 py-1 text-sm focus:outline-none"
                            placeholder="e.g. eyJhbGciOi..."
                        />
                    </div>
                </div>
            )}

            {auth.type === 'apikey' && (
                <div className="flex flex-col gap-3 max-w-md">
                    <div className="flex gap-2 items-center">
                        <label className="w-20 text-sm">Key</label>
                        <input
                            type="text"
                            value={auth.apikey?.key || ''}
                            onChange={(e) => updateNested('apikey', 'key', e.target.value)}
                            className="flex-1 bg-[#3c3c3c] border border-[#3c3c3c] rounded px-2 py-1 text-sm focus:outline-none"
                        />
                    </div>
                    <div className="flex gap-2 items-center">
                        <label className="w-20 text-sm">Value</label>
                        <input
                            type="text"
                            value={auth.apikey?.value || ''}
                            onChange={(e) => updateNested('apikey', 'value', e.target.value)}
                            className="flex-1 bg-[#3c3c3c] border border-[#3c3c3c] rounded px-2 py-1 text-sm focus:outline-none"
                        />
                    </div>
                    <div className="flex gap-2 items-center">
                        <label className="w-20 text-sm">Add to</label>
                        <select
                            value={auth.apikey?.in || 'header'}
                            onChange={(e) => updateNested('apikey', 'in', e.target.value)}
                            className="flex-1 bg-[#3c3c3c] border border-[#3c3c3c] rounded px-2 py-1 text-sm focus:outline-none"
                        >
                            <option value="header">Header</option>
                            <option value="query">Query Params</option>
                        </select>
                    </div>
                </div>
            )}
        </div>
    );
}
