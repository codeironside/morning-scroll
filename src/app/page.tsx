'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { HeroArticle } from '@/components/HeroArticle';
import { ArticleCard } from '@/components/ArticleCard';

import { useBookmarks } from '@/context/BookmarkContext';

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('Top Stories');
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { bookmarks } = useBookmarks();

  useEffect(() => {
    if (activeCategory === 'Saved Articles') {
      setArticles(bookmarks);
      setLoading(false);
      return;
    }

    const fetchNews = async () => {
      setLoading(true);
      try {
        let url = `/api/news?category=${encodeURIComponent(activeCategory)}`;

        if (activeCategory === 'My Feed') {
          const bookmarkedCategories = Array.from(new Set(bookmarks.map(b => b.category)));
          if (bookmarkedCategories.length > 0) {
            url = `/api/news?categories=${encodeURIComponent(bookmarkedCategories.join(','))}`;
          } else {
            url = `/api/news?category=Top Stories`;
          }
        }

        const res = await fetch(url);
        const data = await res.json();
        setArticles(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch news:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [activeCategory, bookmarks]); // Added bookmarks to dependency array for 'My Feed' logic

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
      <Header
        onMenuClick={() => setIsSidebarOpen(true)}
        onSavedFeedClick={() => setActiveCategory('Saved Articles')}
      />

      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          <Sidebar
            selectedCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
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
                    <button className="text-sm font-semibold text-muted hover:text-primary">
                      View All
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {gridArticles.map((article, index) => (
                      <ArticleCard key={article.url || index} article={article} />
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
            © 2026 Morning Brew. All rights reserved. Built for your daily catchup.
          </p>
        </div>
      </footer>
    </div>
  );
}
