import { LogOut } from 'lucide-react';

interface ProfileMenuProps {
    username: string;
    showMenu: boolean;
    onToggleMenu: () => void;
    onLogout: () => void;
}

export default function ProfileMenu({
    username,
    showMenu,
    onToggleMenu,
    onLogout
}: ProfileMenuProps) {
    return (
        <div className="relative z-50">
            <button
                onClick={onToggleMenu}
                className="flex items-center gap-2 px-2 py-1 hover:bg-[#333333] rounded-md text-[#cccccc] transition-colors"
            >
                <div className="w-5 h-5 bg-[#007acc] rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                    {username.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs hidden md:block">{username}</span>
            </button>

            {showMenu && (
                <>
                    <div className="fixed inset-0 z-40" onClick={onToggleMenu} />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-[#252526] border border-[#454545] rounded-md shadow-lg py-1 z-[9999]">
                        <div className="px-3 py-2 border-b border-[#454545]">
                            <p className="text-xs font-medium text-white">{username}</p>
                            <p className="text-[10px] text-[#858585] truncate">Logged in</p>
                        </div>
                        <button
                            onClick={onLogout}
                            className="w-full text-left px-3 py-2 text-xs text-[#cccccc] hover:bg-[#04395e] hover:text-white flex items-center gap-2"
                        >
                            <LogOut size={12} />
                            Sign Out
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
