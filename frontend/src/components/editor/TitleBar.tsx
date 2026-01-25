import { ArrowLeft, Save } from 'lucide-react';
import ProfileMenu from './ProfileMenu.tsx';

interface TitleBarProps {
    templateName: string;
    username: string;
    showProfileMenu: boolean;
    onToggleProfileMenu: () => void;
    onSave: () => void;
    onLogout: () => void;
}

export default function TitleBar({
    templateName,
    username,
    showProfileMenu,
    onToggleProfileMenu,
    onSave,
    onLogout
}: TitleBarProps) {
    return (
        <div className="h-8 flex items-center bg-[#1e1e1e] border-b border-[#2b2b2b] select-none">
            <div className="flex items-center gap-2 px-4">
                <div className="flex gap-2 group">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#ff5f56]/80 transition-colors" />
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#ffbd2e]/80 transition-colors" />
                    <div className="w-3 h-3 rounded-full bg-[#27ca40] hover:bg-[#27ca40]/80 transition-colors" />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={() => window.location.href = '/'}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-[#cccccc] hover:bg-[#333333] hover:text-white rounded-md transition-colors"
                    title="Go Back to Dashboard"
                >
                    <ArrowLeft size={14} />
                    Back
                </button>
                <div className="h-4 w-[1px] bg-[#333333]" />
                <img src="/vscode-logo.svg" alt="VS Code" className="w-5 h-5 block" />
                <div className="flex items-center gap-1 text-[13px]">
                    <span className="font-normal text-[#cccccc]">Code Playground</span>
                    <span className="text-[#858585] mx-1">-</span>
                    <span className="font-medium text-white">{templateName || 'Workspace'}</span>
                </div>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-3 mr-4">
                <button
                    onClick={onSave}
                    className="flex items-center gap-1.5 px-3 py-1 bg-[#007acc] hover:bg-[#0062a3] text-white rounded-[2px] text-xs font-medium transition-colors shadow-sm"
                >
                    <Save size={13} />
                    Save
                </button>

                <ProfileMenu
                    username={username}
                    showMenu={showProfileMenu}
                    onToggleMenu={onToggleProfileMenu}
                    onLogout={onLogout}
                />
            </div>
        </div>
    );
}
