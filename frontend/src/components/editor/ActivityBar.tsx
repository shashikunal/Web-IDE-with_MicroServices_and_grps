import { LucideIcon, Settings, User as UserIcon } from 'lucide-react';

interface ActivityItem {
    id: string;
    icon: LucideIcon;
    label: string;
}

interface ActivityBarProps {
    items: ActivityItem[];
    activeActivity: string;
    onActivityChange: (activityId: string) => void;
    onProfileClick: () => void;
}

export default function ActivityBar({
    items,
    activeActivity,
    onActivityChange,
    onProfileClick
}: ActivityBarProps) {
    return (
        <div className="w-[48px] flex flex-col items-center py-2 bg-[#333333] border-r border-[#252526] z-20">
            {items.map((item) => (
                <button
                    key={item.id}
                    onClick={() => onActivityChange(item.id)}
                    className={`p-3 mb-2 rounded-md transition-colors relative group ${activeActivity === item.id ? 'text-white' : 'text-[#858585] hover:text-white'
                        }`}
                    title={item.label}
                >
                    <item.icon size={24} strokeWidth={1.5} />
                    {activeActivity === item.id && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-8 bg-white rounded-r"></div>
                    )}
                </button>
            ))}
            <div className="flex-1" />
            <button
                className="p-3 mb-2 text-[#858585] hover:text-white transition-colors"
                onClick={onProfileClick}
                title="Accounts"
            >
                <UserIcon size={24} strokeWidth={1.5} />
            </button>
            <button
                className="p-3 text-[#858585] hover:text-white transition-colors"
                title="Settings"
            >
                <Settings size={24} strokeWidth={1.5} />
            </button>
        </div>
    );
}
