import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { deduplicateArticles, filterByMorningWindow } from '@/lib/news-utils';

const parser = new Parser({
    customFields: {
        item: [
            ['media:thumbnail', 'mediaThumbnail'],
            ['media:content', 'mediaContent'],
            ['content:encoded', 'contentEncoded'],
            ['image', 'image']
        ]
    }
});

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
    ],
    "Lifestyle": [
        "https://www.vogue.com/feed/rss",
        "https://www.architecturaldigest.com/feed/rss",
        "https://www.bonappetit.com/feed/rss"
    ],
    "Arts & Culture": [
        "https://www.newyorker.com/feed/culture",
        "https://www.theatlantic.com/feed/channel/culture/",
        "https://api.quantamagazine.org/feed/"
    ],
    "Opinion": [
        "https://www.nytimes.com/svc/vendor/nythelp/rss/resources/opinion.xml",
        "https://www.theguardian.com/commentisfree/rss",
        "https://www.aljazeera.com/xml/rss/all.xml"
    ]
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'Top Stories';
    const categoriesParam = searchParams.get('categories');
    const searchQuery = searchParams.get('q')?.toLowerCase();
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
                return feed.items.map((item: any) => ({
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

        // 1. Filter by search query if provided
        if (searchQuery) {
            allArticles = allArticles.filter(article =>
                article.title?.toLowerCase().includes(searchQuery) ||
                article.description?.toLowerCase().includes(searchQuery)
            );
        }

        // 2. Filter by "Morning Window"
        // If searching, relax the window to 7 days (168 hours) to find more relevant results
        const windowHours = searchQuery ? 168 : 24;
        const freshArticles = filterByMorningWindow(allArticles, windowHours);

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
    // 1. Try enclosure (common for podcasts and some news sites)
    if (item.enclosure && item.enclosure.url && isImage(item.enclosure.url)) {
        return item.enclosure.url;
    }

    // 2. Try mediaContent (standard Media RSS, mapped from media:content)
    const mediaContent = item.mediaContent;
    if (mediaContent) {
        // media:content can be an object or an array
        const mediaArray = Array.isArray(mediaContent) ? mediaContent : [mediaContent];
        const image = mediaArray.find(m => m.$ && m.$.url && (!m.$.medium || m.$.medium === 'image'));
        if (image && image.$ && image.$.url) return image.$.url;
    }

    // 3. Try mediaThumbnail (mapped from media:thumbnail)
    const mediaThumbnail = item.mediaThumbnail;
    if (mediaThumbnail) {
        const thumbArray = Array.isArray(mediaThumbnail) ? mediaThumbnail : [mediaThumbnail];
        if (thumbArray[0] && thumbArray[0].$ && thumbArray[0].$.url) return thumbArray[0].$.url;
    }

    // 4. Try top-level image field
    if (item.image && typeof item.image === 'string') return item.image;
    if (item.image && item.image.url) return item.image.url;

    // 5. Search for <img> tag in content or contentEncoded (mapped from content:encoded)
    const content = item.contentEncoded || item.content || item.contentSnippet || '';
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch && imgMatch[1] && !imgMatch[1].includes('feedburner')) {
        return imgMatch[1];
    }

    // Generic placeholder based on category if no image found
    return `https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2070&auto=format&fit=crop`;
}

function isImage(url: string) {
    return /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url);
}
