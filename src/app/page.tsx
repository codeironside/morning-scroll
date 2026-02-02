'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { HeroArticle } from '@/components/HeroArticle';
import { ArticleCard } from '@/components/ArticleCard';
import { PreferencesModal } from '@/components/Onboarding';
import { AddToHomescreen } from '@/components/AddToHomescreen';

import { useBookmarks } from '@/context/BookmarkContext';

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('Top Stories');
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userCategories, setUserCategories] = useState<string[]>([]);

  const [viewPreference, setViewPreference] = useState<'grid' | 'list'>('grid');
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  const { bookmarks } = useBookmarks();

  useEffect(() => {
    // Load persisted user categories and view preference
    const savedCategories = localStorage.getItem('userCategories');
    const savedViewPreference = localStorage.getItem('viewPreference') as 'grid' | 'list';
    const hasOnboarded = localStorage.getItem('onboarded');

    if (savedCategories) {
      setUserCategories(JSON.parse(savedCategories));
      setActiveCategory('My Feed');
    }

    if (savedViewPreference) {
      setViewPreference(savedViewPreference);
    }

    if (!hasOnboarded) {
      setIsPreferencesOpen(true);
    }
  }, []);

  useEffect(() => {
    if (activeCategory === 'Saved Articles') {
      setArticles(bookmarks);
      setLoading(false);
      return;
    }

    const fetchNews = async () => {
      setLoading(true);
      try {
        let url = `http://localhost:2345/api/v1/news?category=${encodeURIComponent(activeCategory)}`;

        if (searchQuery) {
          url += `&q=${encodeURIComponent(searchQuery)}`;
        }

        if (activeCategory === 'My Feed') {
          // Use userCategories if in 'My Feed'
          const feedCategories = userCategories.length > 0 ? userCategories : ['Top Stories'];
          url = `http://localhost:2345/api/v1/news?categories=${encodeURIComponent(feedCategories.join(','))}`;
          if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;
        }

        const res = await fetch(url);
        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          setArticles(data.data);
        } else {
          setArticles([]);
          console.error('API response format error or unsuccessful:', data);
        }
      } catch (error) {
        console.error('Failed to fetch news:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [activeCategory, bookmarks, searchQuery, userCategories]);

  // Update articles list when bookmarks change, but only if we are in 'Saved Articles' view
  useEffect(() => {
    if (activeCategory === 'Saved Articles') {
      setArticles(bookmarks);
    }
  }, [bookmarks, activeCategory]);

  const heroArticle = articles.find((a) => a.isHero) || articles[0];
  const gridArticles = articles.filter((a) => a !== heroArticle);

  return (
    <div className="min-h-screen bg-background">
      <PreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
        initialCategories={userCategories}
        initialViewPreference={viewPreference}
        onComplete={(categories, view) => {
          // Check if this was the first onboarding to show install prompt
          // We can check if userCategories was empty before update, or just check localStorage before this update (but it's async/React state). 
          // Simplest: If we are in this callback, and we just set 'onboarded' (which modal does), we can assume it's a good time to prompt if not already installed.
          // But to differentiate "Settings Update" vs "First Onboarding", we can check if 'userCategories' (state) was empty.
          if (userCategories.length === 0) {
            setShowInstallPrompt(true);
          }

          setUserCategories(categories);
          setViewPreference(view);
          setActiveCategory('My Feed');
          setIsPreferencesOpen(false);
        }}
      />

      <AddToHomescreen
        isOpen={showInstallPrompt}
        onClose={() => setShowInstallPrompt(false)}
      />

      <Header
        onMenuClick={() => setIsSidebarOpen(true)}
        onSavedFeedClick={() => setActiveCategory('Saved Articles')}
        onSearch={setSearchQuery}
      />

      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          <Sidebar
            selectedCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            userCategories={userCategories}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onSettingsClick={() => setIsPreferencesOpen(true)}
          />

          <div className="flex-1">
            {loading ? (
              <div className="flex h-[400px] items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-accent" />
              </div>
            ) : (
              <div className="flex flex-col gap-12">
                {heroArticle && <HeroArticle article={heroArticle} />}

                <section>
                  <div className="mb-8 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-primary">Latest Stories</h2>
                    <div className="flex gap-2">
                      {/* Optional: Add visible toggles for view preference here if desired later */}
                    </div>
                  </div>

                  <div className={
                    viewPreference === 'grid'
                      ? "grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
                      : "flex flex-col gap-6"
                  }>
                    {gridArticles.map((article, index) => (
                      <ArticleCard
                        key={article.url || index}
                        article={article}
                        viewMode={viewPreference}
                      />
                    ))}
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-20 border-t border-slate-200 bg-white py-12">
        <div className="container mx-auto px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-muted">
            © 2026 Morning Scroll. All rights reserved. Built by{' '}
            <a
              href="https://twitter.com/geektutor"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:text-accent transition-colors"
            >
              Geektutor
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
