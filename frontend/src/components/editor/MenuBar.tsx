interface MenuItem {
    label?: string;
    shortcut?: string;
    divider?: boolean;
}

interface Menu {
    label: string;
    items: MenuItem[];
}

interface MenuBarProps {
    menus: Menu[];
    activeMenu: string | null;
    onMenuClick: (menuLabel: string) => void;
    onMenuItemClick: (action: string) => void;
    onClose: () => void;
}

export default function MenuBar({
    menus,
    activeMenu,
    onMenuClick,
    onMenuItemClick,
    onClose
}: MenuBarProps) {
    return (
        <>
            <div className="h-7 flex items-center bg-[#1e1e1e] border-b border-[#2b2b2b] px-2 select-none relative z-50">
                <div className="flex items-center gap-1 h-full">
                    {menus.map((menu) => (
                        <div key={menu.label} className="relative h-full">
                            <button
                                id={`menu-btn-${menu.label}`}
                                onClick={() => onMenuClick(menu.label)}
                                className={`h-full px-3 text-[13px] font-normal text-[#cccccc] hover:bg-[#3d3d3d] hover:text-white transition-colors cursor-default select-none flex items-center rounded-sm ${activeMenu === menu.label ? 'bg-[#3d3d3d] text-white' : ''
                                    }`}
                            >
                                {menu.label}
                            </button>
                            {activeMenu === menu.label && (
                                <div className="absolute left-0 top-full bg-[#1e1e1e] border border-[#454545] rounded-lg shadow-2xl z-[9999] min-w-[220px] py-1 focus:outline-none flex flex-col mt-1">
                                    {menu.items.map((item, i) =>
                                        item.divider ? (
                                            <div key={i} className="h-[1px] bg-[#454545] my-1 w-full" />
                                        ) : (
                                            <button
                                                key={i}
                                                onClick={() => item.label && onMenuItemClick(item.label.toLowerCase().replace(/\s+/g, ''))}
                                                className="w-full flex items-center px-3 py-1.5 text-[13px] text-[#cccccc] hover:bg-[#04395e] hover:text-white transition-colors text-left group gap-4 relative"
                                            >
                                                <span className="flex-1 truncate">{item.label}</span>
                                                {item.shortcut && (
                                                    <span className="text-[#858585] text-xs font-normal group-hover:text-white">
                                                        {item.shortcut}
                                                    </span>
                                                )}
                                            </button>
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            {activeMenu && <div className="fixed inset-0 z-40" onClick={onClose} />}
        </>
    );
}
