import { GitBranch, RefreshCw } from 'lucide-react';

interface Tab {
    id: string;
    name: string;
    path: string;
    content: string;
    language: string;
    modified: boolean;
}

interface StatusBarProps {
    currentTab: Tab | undefined;
    isConnected: boolean;
}

export default function StatusBar({ currentTab, isConnected }: StatusBarProps) {
    const getLanguageDisplay = (language?: string) => {
        const languageMap: Record<string, string> = {
            'typescript': 'TypeScript JSX',
            'javascript': 'JavaScript',
            'python': 'Python',
            'html': 'HTML',
            'css': 'CSS',
            'json': 'JSON'
        };
        return languageMap[language || ''] || 'Plain Text';
    };

    return (
        <div className="h-[22px] flex items-center bg-[#007acc] px-2 text-[12px] text-white select-none justify-between z-50 relative shrink-0">
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 hover:bg-white/20 px-1 py-0.5 rounded cursor-pointer transition-colors">
                    <GitBranch size={12} />
                    <span className="font-normal text-[11px]">main*</span>
                </div>
                <div className="flex items-center gap-1 hover:bg-white/20 px-1 py-0.5 rounded cursor-pointer transition-colors">
                    <RefreshCw size={12} />
                    <span className="text-[11px]">0 ↓ 1 ↑</span>
                </div>
                <div className="flex items-center gap-2 hover:bg-white/20 px-1 py-0.5 rounded cursor-pointer transition-colors">
                    <span className="text-[11px]">⊗ 0</span>
                    <span className="text-[11px]">⚠ 0</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="hover:bg-white/20 px-1 py-0.5 rounded cursor-pointer transition-colors text-[11px]">
                    Ln {currentTab ? 12 : 0}, Col {currentTab ? 45 : 0}
                </div>
                <div className="hover:bg-white/20 px-1 py-0.5 rounded cursor-pointer transition-colors hidden sm:block text-[11px]">
                    Spaces: 2
                </div>
                <div className="hover:bg-white/20 px-1 py-0.5 rounded cursor-pointer transition-colors hidden sm:block text-[11px]">
                    UTF-8
                </div>
                <div className="hover:bg-white/20 px-1 py-0.5 rounded cursor-pointer transition-colors hidden sm:block text-[11px]">
                    LF
                </div>
                <div className="hover:bg-white/20 px-1 py-0.5 rounded cursor-pointer transition-colors font-medium text-[11px]">
                    {getLanguageDisplay(currentTab?.language)}
                </div>
                <div className="hover:bg-white/20 px-1 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-1.5">
                    {isConnected ? (
                        <div className="w-2 h-2 rounded-full bg-white/90" />
                    ) : (
                        <div className="w-2 h-2 rounded-full bg-red-400" />
                    )}
                    <span className="text-[11px]">{isConnected ? 'Remote' : 'Disconnected'}</span>
                </div>
                <div className="hover:bg-white/20 px-1 py-0.5 rounded cursor-pointer transition-colors">
                    <span className="text-white/90 text-[11px]">Prettier</span>
                </div>
            </div>
        </div>
    );
}
