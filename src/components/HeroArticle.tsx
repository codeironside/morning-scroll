import React from 'react';
import { ArrowRight } from 'lucide-react';

interface HeroArticleProps {
    article: {
        title: string;
        description: string;
        image: string;
        category: string;
        url: string;
    };
}

import { Bookmark } from 'lucide-react';
import { useBookmarks } from '@/context/BookmarkContext';

export const HeroArticle = ({ article }: HeroArticleProps) => {
    const { toggleBookmark, isBookmarked } = useBookmarks();
    const bookmarked = isBookmarked(article.url);

    return (
        <section className="relative overflow-hidden rounded-3xl bg-primary text-white">
            <div className="absolute inset-0 z-0">
                <img
                    src={article.image}
                    alt={article.title}
                    className="h-full w-full object-cover opacity-40 transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/40 to-transparent" />
            </div>

            <div className="relative z-10 flex flex-col justify-end p-8 md:p-12 lg:min-h-[400px]">
                <div className="flex items-center justify-between mb-4">
                    <div className="inline-flex rounded-full bg-accent/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent backdrop-blur-md">
                        Featured Story
                    </div>
                    <button
                        onClick={() => toggleBookmark(article as any)}
                        className={`rounded-full p-2 transition-all ${bookmarked
                                ? 'bg-accent text-primary'
                                : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                    >
                        <Bookmark size={20} fill={bookmarked ? "currentColor" : "none"} />
                    </button>
                </div>
                <h1 className="mb-4 max-w-3xl text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
                    {article.title}
                </h1>
                <p className="mb-8 max-w-2xl text-lg text-slate-300">
                    {article.description}
                </p>
                <div>
                    <div>
                        <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-primary transition-all hover:bg-slate-100 active:scale-95"
                        >
                            Read More <ArrowRight size={18} />
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
};
