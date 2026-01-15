'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Article {
    title: string;
    description: string;
    image: string;
    category: string;
    url: string;
    publishedAt: string;
    source: string;
}

interface BookmarkContextType {
    bookmarks: Article[];
    toggleBookmark: (article: Article) => void;
    isBookmarked: (url: string) => boolean;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

export const BookmarkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [bookmarks, setBookmarks] = useState<Article[]>([]);

    // Load bookmarks from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('morning-brew-bookmarks');
        if (saved) {
            try {
                setBookmarks(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse bookmarks', e);
            }
        }
    }, []);

    // Save bookmarks to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('morning-brew-bookmarks', JSON.stringify(bookmarks));
    }, [bookmarks]);

    const toggleBookmark = (article: Article) => {
        setBookmarks((prev) => {
            const exists = prev.find((b) => b.url === article.url);
            if (exists) {
                return prev.filter((b) => b.url !== article.url);
            }
            return [article, ...prev];
        });
    };

    const isBookmarked = (url: string) => {
        return bookmarks.some((b) => b.url === url);
    };

    return (
        <BookmarkContext.Provider value={{ bookmarks, toggleBookmark, isBookmarked }}>
            {children}
        </BookmarkContext.Provider>
    );
};

export const useBookmarks = () => {
    const context = useContext(BookmarkContext);
    if (context === undefined) {
        throw new Error('useBookmarks must be used within a BookmarkProvider');
    }
    return context;
};
