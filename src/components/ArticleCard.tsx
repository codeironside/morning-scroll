import React, { useState, useEffect } from 'react';
import { Bookmark, Share2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ArticleCardProps {
    article: {
        title: string;
        description: string;
        image: string;
        category: string;
        publishedAt: string;
        url: string;
    };
}

import { useBookmarks } from '@/context/BookmarkContext';

export const ArticleCard = ({ article }: ArticleCardProps) => {
    const { toggleBookmark, isBookmarked } = useBookmarks();
    const [copied, setCopied] = useState(false);
    const bookmarked = isBookmarked(article.url);

    useEffect(() => {
        if (copied) {
            const timer = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [copied]);

    const handleShare = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (navigator.share) {
            try {
                await navigator.share({
                    title: article.title,
                    text: article.description,
                    url: article.url,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            try {
                await navigator.clipboard.writeText(article.url);
                setCopied(true);
            } catch (error) {
                console.error('Error copying to clipboard:', error);
            }
        }
    };

    const date = new Date(article.publishedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    return (
        <article className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-md">
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="relative aspect-video overflow-hidden">
                <img
                    src={article.image}
                    alt={article.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute left-4 top-4 rounded-lg bg-primary/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                    {article.category}
                </div>
            </a>

            <div className="flex flex-1 flex-col p-5">
                <a href={article.url} target="_blank" rel="noopener noreferrer">
                    <h3 className="mb-2 text-lg font-bold leading-snug text-primary group-hover:text-primary/80">
                        {article.title}
                    </h3>
                </a>
                <p className="mb-4 line-clamp-3 text-sm text-muted">
                    {article.description}
                </p>

                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-xs font-medium text-muted">{date}</span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => toggleBookmark(article as any)}
                            className={`rounded-full p-1.5 transition-colors ${bookmarked
                                ? 'bg-primary text-white'
                                : 'text-muted hover:bg-slate-100 hover:text-primary'
                                }`}
                        >
                            <Bookmark size={16} fill={bookmarked ? "currentColor" : "none"} />
                        </button>
                        <button
                            onClick={handleShare}
                            className={cn(
                                "relative rounded-full p-1.5 transition-all",
                                copied ? "bg-green-500 text-white" : "text-muted hover:bg-slate-100 hover:text-primary"
                            )}
                        >
                            {copied ? <Check size={16} /> : <Share2 size={16} />}
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
};
