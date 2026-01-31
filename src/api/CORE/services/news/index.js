import Parser from 'rss-parser';
import { config } from '../../utils/config/index.js';



export async function fetchNews(category = 'Top Stories', categories = null) {
    // Parser configured to look like a real browser
    const parser = new Parser({
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/rss+xml, application/xml, text/xml; q=0.1'
        },
        // timeout: 10000 // 10 second timeout per feed
    });

    const categoriesToFetch = categories ? categories.split(',') : [category];
    let feedsToFetch = [];

    // If 'Top Stories', fetch EVERYTHING in the config
    if (category === 'Top Stories' && !categories) {
        Object.entries(config.rss_feed).forEach(([catName, urls]) => {
            urls.forEach(url => {
                feedsToFetch.push({ url, category: catName });
            });
        });
    } else {
        categoriesToFetch.forEach(cat => {
            const feeds = config.rss_feed[cat] || [];
            feeds.forEach(url => {
                feedsToFetch.push({ url, category: cat });
            });
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
            // Silence the errors to keep logs clean, or use e.message to debug specific URLs
            // console.error(`⚠️ Skipped ${url}: ${e.message}`);
            return [];
        }
    });

    const results = await Promise.all(feedPromises);
    const allArticles = results.flat();

    const freshArticles = filterByMorningWindow(allArticles, 24);
    const uniqueArticles = deduplicateArticles(freshArticles);

    // Shuffle/Mix logic
    const groupedBySource = {};
    uniqueArticles.forEach(article => {
        if (!groupedBySource[article.source]) {
            groupedBySource[article.source] = [];
        }
        groupedBySource[article.source].push(article);
    });

    Object.values(groupedBySource).forEach(group => {
        group.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    });

    const mixedArticles = [];
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

    return mixedArticles;
}

function extractImage(item) {
    if (item.enclosure && item.enclosure.url) return item.enclosure.url;
    const mediaContent = item['media:content'];
    if (mediaContent && mediaContent.$ && mediaContent.$.url) return mediaContent.$.url;
    const content = item.content || item.contentSnippet || '';
    const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch) return imgMatch[1];

    // Default fallback image
    return `https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2070&auto=format&fit=crop`;
}

function filterByMorningWindow(articles, hours) {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);
    return articles.filter(article => new Date(article.publishedAt) > cutoffTime);
}

function deduplicateArticles(articles) {
    const seen = new Set();
    return articles.filter(article => {
        const key = `${article.title.toLowerCase().trim()}_${article.source}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}