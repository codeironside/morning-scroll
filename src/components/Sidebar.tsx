import React from 'react';
import {
    LayoutGrid,
    Cpu,
    Briefcase,
    FlaskConical,
    Gavel,
    Heart,
    Palette,
    MessageSquare,
    Bookmark,
    Rss,
    Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

const categories = [
    { name: 'Top Stories', icon: LayoutGrid },
    { name: 'Technology', icon: Cpu },
    { name: 'World News', icon: Gavel },
    { name: 'Finance & Markets', icon: Briefcase },
    { name: 'Science & Nature', icon: FlaskConical },
    { name: 'Lifestyle', icon: Heart },
    { name: 'Arts & Culture', icon: Palette },
    { name: 'Opinion', icon: MessageSquare },
];

const myFeed = [
    { name: 'Saved Articles', icon: Bookmark },
    { name: 'My Feed', icon: Rss },
];

interface SidebarProps {
    selectedCategory: string;
    onCategoryChange: (category: string) => void;
    isOpen?: boolean;
    onClose?: () => void;
}

export const Sidebar = ({ selectedCategory, onCategoryChange, isOpen, onClose }: SidebarProps) => {
    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 flex w-64 flex-col gap-8 bg-white px-4 py-8 transition-transform duration-300 lg:static lg:z-0 lg:flex lg:translate-x-0 lg:bg-transparent lg:px-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex items-center justify-between lg:hidden">
                    <span className="text-xl font-bold tracking-tight text-primary">
                        Morning <span className="text-accent">Brew</span>
                    </span>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                    >
                        <Check size={20} className="rotate-45" /> {/* Using Check as a close icon for now, or just use X if available */}
                    </button>
                </div>

                <div>
                    <h3 className="mb-4 px-4 text-xs font-semibold uppercase tracking-wider text-muted">
                        Discover Categories
                    </h3>
                    <nav className="flex flex-col gap-1">
                        {categories.map((cat) => (
                            <button
                                key={cat.name}
                                onClick={() => {
                                    onCategoryChange(cat.name);
                                    onClose?.();
                                }}
                                className={cn(
                                    "flex items-center justify-between rounded-lg px-4 py-2.5 text-sm font-medium transition-all hover:bg-slate-100",
                                    selectedCategory === cat.name ? "bg-primary text-white hover:bg-primary/90" : "text-slate-600"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <cat.icon size={18} />
                                    {cat.name}
                                </div>
                                {selectedCategory === cat.name && <Check size={14} />}
                            </button>
                        ))}
                    </nav>
                </div>

                <div>
                    <h3 className="mb-4 px-4 text-xs font-semibold uppercase tracking-wider text-muted">
                        Personal
                    </h3>
                    <nav className="flex flex-col gap-1">
                        {myFeed.map((item) => (
                            <button
                                key={item.name}
                                onClick={() => {
                                    onCategoryChange(item.name);
                                    onClose?.();
                                }}
                                className={cn(
                                    "flex items-center justify-between rounded-lg px-4 py-2.5 text-sm font-medium transition-all hover:bg-slate-100",
                                    selectedCategory === item.name ? "bg-primary text-white hover:bg-primary/90" : "text-slate-600"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon size={18} />
                                    {item.name}
                                </div>
                                {selectedCategory === item.name && <Check size={14} />}
                            </button>
                        ))}
                    </nav>
                </div>
            </aside>
        </>
    );
};
