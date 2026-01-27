import { useState } from 'react';
import type { Template } from '../../store/api/apiSlice';

export interface WorkspaceConfig {
    title: string;
    description: string;
    cpu: number;
    memory: string;
    port?: number;
}

interface Props {
    template: Template;
    onConfirm: (config: WorkspaceConfig) => void;
    onCancel: () => void;
}

export default function WorkspaceConfigModal({ template, onConfirm, onCancel }: Props) {
    const [title, setTitle] = useState(`${template.name} Workspace`);
    const [description, setDescription] = useState('');
    const [cpu, setCpu] = useState(2);
    const [memory, setMemory] = useState('2g');
    const [port, setPort] = useState<string>(''); // Default empty to use template default unless overridden

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm({
            title,
            description,
            cpu: Number(cpu),
            memory,
            port: port ? parseInt(port, 10) : undefined
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-[#252526] border border-[#3d3d3d] rounded-xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-lg bg-[#007acc]/10 flex items-center justify-center text-3xl">
                            {template.icon}
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-[#cccccc]">Configure Workspace</h2>
                            <p className="text-[#858585] text-sm">Customize your {template.name} environment</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[#cccccc] mb-1">Workspace Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-3 py-2 bg-[#3c3c3c] border border-[#3d3d3d] rounded-md text-white placeholder-[#858585] focus:outline-none focus:border-[#007acc] transition-colors"
                                placeholder="My Awesome Project"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#cccccc] mb-1">Description (Optional)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-3 py-2 bg-[#3c3c3c] border border-[#3d3d3d] rounded-md text-white placeholder-[#858585] focus:outline-none focus:border-[#007acc] transition-colors resize-none h-20"
                                placeholder="What are you building today?"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[#cccccc] mb-1">CPU Cores</label>
                                <select
                                    value={cpu}
                                    onChange={(e) => setCpu(Number(e.target.value))}
                                    className="w-full px-3 py-2 bg-[#3c3c3c] border border-[#3d3d3d] rounded-md text-white focus:outline-none focus:border-[#007acc]"
                                >
                                    <option value={1}>1 Core</option>
                                    <option value={2}>2 Cores (Default)</option>
                                    <option value={4}>4 Cores</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#cccccc] mb-1">Memory</label>
                                <select
                                    value={memory}
                                    onChange={(e) => setMemory(e.target.value)}
                                    className="w-full px-3 py-2 bg-[#3c3c3c] border border-[#3d3d3d] rounded-md text-white focus:outline-none focus:border-[#007acc]"
                                >
                                    <option value="1g">1 GB</option>
                                    <option value="2g">2 GB (Default)</option>
                                    <option value="4g">4 GB</option>
                                    <option value="8g">8 GB</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#cccccc] mb-1">
                                Internal Port Override (Optional)
                            </label>
                            <input
                                type="number"
                                value={port}
                                onChange={(e) => setPort(e.target.value)}
                                className="w-full px-3 py-2 bg-[#3c3c3c] border border-[#3d3d3d] rounded-md text-white placeholder-[#858585] focus:outline-none focus:border-[#007acc] transition-colors"
                                placeholder={`Default: ${template.port || 'Auto'}`}
                            />
                            <p className="text-xs text-[#858585] mt-1">
                                Only change this if your application listens on a non-standard port.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-8">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-[#cccccc] hover:bg-[#3d3d3d] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-[#007acc] text-white hover:bg-[#007acc]/90 transition-colors shadow-lg shadow-[#007acc]/20"
                        >
                            Create Workspace
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
