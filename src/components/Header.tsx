import React from 'react';
import { Search, Bookmark, Menu, Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
    onMenuClick?: () => void;
    onSavedFeedClick?: () => void;
}

export const Header = ({ onMenuClick, onSavedFeedClick }: HeaderProps) => {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-2">
                    <button
                        onClick={onMenuClick}
                        className="mr-2 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                        aria-label="Open menu"
                    >
                        <Menu size={24} />
                    </button>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-accent">
                        <Coffee size={24} />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-primary">
                        Morning <span className="text-accent">Brew</span>
                    </span>
                </div>

                <div className="hidden flex-1 justify-center px-8 md:flex">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                        <input
                            type="text"
                            placeholder="Search news, topics..."
                            className="h-10 w-full rounded-full bg-slate-100 pl-10 pr-4 text-sm outline-none transition-all focus:bg-white focus:ring-2 focus:ring-primary/10"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={onSavedFeedClick}
                        className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-primary transition-colors hover:bg-slate-200"
                    >
                        <Bookmark size={20} className="fill-current" />
                        <span className="hidden text-sm font-semibold sm:inline">Saved Feed</span>
                    </button>
                </div>
            </div>
        </header>
    );
};
