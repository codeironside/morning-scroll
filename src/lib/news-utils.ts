import Fuse from 'fuse.js';

/**
 * Filters articles published within the last N hours.
 */
export function filterByMorningWindow(articles: any[], hours: number = 24) {
    const now = new Date();
    const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);

    return articles.filter(article => {
        const pubDate = new Date(article.publishedAt);
        return pubDate >= cutoff;
    });
}

/**
 * Removes duplicate articles based on fuzzy matching of titles.
 */
export function deduplicateArticles(articles: any[], threshold: number = 0.4) {
    if (articles.length === 0) return [];

    const result: any[] = [];

    for (const article of articles) {
        if (result.length === 0) {
            result.push(article);
            continue;
        }

        const fuse = new Fuse(result, {
            keys: ['title'],
            includeScore: true,
            threshold: threshold, // Lower is more strict (closer match)
        });

        const searchResult = fuse.search(article.title);

        // If no close match found, add to result
        if (searchResult.length === 0) {
            result.push(article);
        } else {
            // Optional: Log duplicate for debugging
            // console.log(`Duplicate detected: "${article.title}" matches "${searchResult[0].item.title}"`);
        }
    }

    return result;
}
