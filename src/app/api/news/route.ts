import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { deduplicateArticles, filterByMorningWindow } from '@/lib/news-utils';

const parser = new Parser();

const FEED_CONFIG = {
    "Nigeria": [
        "https://www.vanguardngr.com/feed/",
        "https://punchng.com/feed/",
        "https://www.premiumtimesng.com/feed",
        "https://guardian.ng/feed/"
    ],
    "Technology": [
        "https://hnrss.org/frontpage",
        "https://www.theverge.com/rss/index.xml",
        "https://techcrunch.com/feed/"
    ],
    "World News": [
        "http://feeds.bbci.co.uk/news/world/rss.xml",
        "https://www.aljazeera.com/xml/rss/all.xml",
        "https://rss.nytimes.com/services/xml/rss/nyt/World.xml"
    ],
    "Finance & Markets": [
        "https://search.cnbc.com/rs/search/view.xml?partnerId=2000&keywords=finance",
        "https://www.ft.com/?format=rss"
    ],
    "Science & Nature": [
        "https://www.quantamagazine.org/feed/",
        "https://feeds.npr.org/1007/rss.xml"
    ]
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'Top Stories';
    const categoriesParam = searchParams.get('categories');
    const categoriesToFetch = categoriesParam ? categoriesParam.split(',') : [category];

    try {
        let allArticles: any[] = [];
        let feedsToFetch: { url: string, category: string }[] = [];

        categoriesToFetch.forEach(cat => {
            const feeds = FEED_CONFIG[cat as keyof typeof FEED_CONFIG] || (cat === 'Top Stories' ? FEED_CONFIG["Nigeria"] : []);
            feeds.forEach(url => {
                feedsToFetch.push({ url, category: cat });
            });
        });

        // If no feeds found, default to Nigeria
        if (feedsToFetch.length === 0) {
            FEED_CONFIG["Nigeria"].forEach(url => {
                feedsToFetch.push({ url, category: 'Top Stories' });
            });
        }

        const feedPromises = feedsToFetch.map(async ({ url, category: articleCategory }) => {
            try {
                const feed = await parser.parseURL(url);
                return feed.items.map(item => ({
                    id: item.guid || item.link || Math.random().toString(),
                    title: item.title,
                    description: item.contentSnippet || item.content || '',
                    category: articleCategory,
                    image: extractImage(item),
                    author: item.creator || item.author || 'Unknown',
                    publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
                    url: item.link,
                    source: feed.title || 'Unknown Source'
                }));
            } catch (e) {
                console.error(`Error fetching feed ${url}:`, e);
                return [];
            }
        });

        const results = await Promise.all(feedPromises);
        allArticles = results.flat();

        // 1. Filter by "Morning Window" (last 24 hours)
        const freshArticles = filterByMorningWindow(allArticles, 24);

        // 2. Deduplicate using fuzzy matching
        const uniqueArticles = deduplicateArticles(freshArticles);

        // 3. Mix sources (Interleaving)
        // Group by source
        const groupedBySource: Record<string, any[]> = {};
        uniqueArticles.forEach(article => {
            if (!groupedBySource[article.source]) {
                groupedBySource[article.source] = [];
            }
            groupedBySource[article.source].push(article);
        });

        // Sort each group by date
        Object.values(groupedBySource).forEach(group => {
            group.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        });

        // Interleave
        const mixedArticles: any[] = [];
        let hasMore = true;
        let index = 0;
        const sources = Object.keys(groupedBySource);

        while (hasMore) {
            hasMore = false;
            sources.forEach(source => {
                if (groupedBySource[source][index]) {
                    mixedArticles.push(groupedBySource[source][index]);
                    hasMore = true;
                }
            });
            index++;
        }

        // 4. Mark the first one as Hero for the UI
        if (mixedArticles.length > 0) {
            mixedArticles[0].isHero = true;
        }

        return NextResponse.json(mixedArticles);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
    }
}

function extractImage(item: any) {
    // Try to find an image in enclosures or media:content
    if (item.enclosure && item.enclosure.url) return item.enclosure.url;

    // Some feeds put images in content or as a separate field
    const mediaContent = item['media:content'];
    if (mediaContent && mediaContent.$ && mediaContent.$.url) return mediaContent.$.url;

    // Fallback: search for <img> tag in content
    const content = item.content || item.contentSnippet || '';
    const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch) return imgMatch[1];

    // Generic placeholder based on category if no image found
    return `https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2070&auto=format&fit=crop`;
}
