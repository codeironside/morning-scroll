import cron from 'node-cron';
import axios from 'axios';
import { fetchNews } from '../news/index.js';

const WAHA_URL = 'http://localhost:3001';
const CHANNEL_ID = '120363409113673268@newsletter';
const WAHA_API_KEY = '4679e98530e64476968b808d0e488497';

const sentHistory = new Set();

function getCategoryEmoji(category) {
    switch (category) {
        case 'Nigeria': return '🇳🇬';
        case 'World News': return '🌍';
        case 'Technology': return '💻';
        case 'Sports': return '⚽';
        case 'Finance': return '💰';
        case 'Entertainment': return '🎬';
        default: return '📰';
    }
}

function getSourceBadge(source) {
    const sourceLower = (source || '').toLowerCase();
    if (sourceLower.includes('vanguard')) return '🏆 Vanguard';
    if (sourceLower.includes('punch')) return '👊 Punch';
    if (sourceLower.includes('cnn')) return '🇺🇸 CNN';
    if (sourceLower.includes('bbc')) return '🇬🇧 BBC';
    if (sourceLower.includes('aljazeera')) return '🌐 Al Jazeera';
    if (sourceLower.includes('nytimes')) return '🗽 NY Times';
    if (sourceLower.includes('techcrunch')) return '🚀 TechCrunch';
    if (sourceLower.includes('bloomberg')) return '💹 Bloomberg';
    if (sourceLower.includes('espn')) return '⚽ ESPN';
    if (sourceLower.includes('hollywood')) return '🎬 Hollywood';
    if (sourceLower.includes('fox')) return '🦊 Fox News';
    if (sourceLower.includes('politico')) return '🏛️ Politico';
    return source || '📰 Source';
}

function formatTimeAgo(publishedAt) {
    const now = new Date();
    const pubDate = new Date(publishedAt);
    if (isNaN(pubDate.getTime())) return '🕐 Recently';

    const hoursDiff = Math.floor((now - pubDate) / (1000 * 60 * 60));

    if (hoursDiff < 1) return '🆕 Just now';
    if (hoursDiff < 2) return '⏰ 1 hour ago';
    if (hoursDiff < 24) return `⏰ ${hoursDiff}h ago`;
    return `📅 ${pubDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function createCaption(article) {
    const categoryEmoji = getCategoryEmoji(article.category);
    const sourceBadge = getSourceBadge(article.source);
    const timeAgo = formatTimeAgo(article.publishedAt);

    const cleanDescription = (article.description || '')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .trim();

    const shortDesc = cleanDescription.length > 120
        ? cleanDescription.substring(0, 120) + '...'
        : cleanDescription;

    let caption = `🔥 *BREAKING NEWS*\n`;
    caption += `${categoryEmoji} *${article.category.toUpperCase()}*\n`;
    caption += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    caption += `📰 *${article.title}*\n\n`;

    if (shortDesc && shortDesc.length > 10) {
        caption += `📝 ${shortDesc}\n\n`;
    }

    caption += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    caption += `🏷️ ${sourceBadge}\n`;
    caption += `${timeAgo}\n`;
    caption += `📊 Read More ⬇️\n\n`;
    caption += `🔗 *Full Story:* ${article.url}\n`;
    caption += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    caption += `💬 *React with:*\n`;
    caption += `👍 = Important  ❤️ = Interesting  🔄 = Share\n\n`;
    caption += `📢 *Join our community:*\n`;
    caption += `👉 https://whatsapp.com/channel/0029Vb7lWMxJpe8p7p58KM2l\n\n`;
    caption += `#BreakingNews #${article.category.replace(/ /g, '')} #MorningScroll`;

    return caption;
}

async function postArticle(article) {
    const caption = createCaption(article);
    const axiosConfig = {
        headers: {
            'X-Api-Key': WAHA_API_KEY,
            'Content-Type': 'application/json'
        }
    };

    if (article.image && article.image.includes('http')) {
        try {
            await axios.post(`${WAHA_URL}/api/sendImage`, {
                chatId: CHANNEL_ID,
                file: {
                    url: article.image,
                    mimetype: "image/jpeg",
                    filename: "news.jpg"
                },
                caption: caption,
                session: "default"
            }, axiosConfig);
            console.log(`✅ Sent Image: ${article.title.substring(0, 50)}...`);
            return;
        } catch (e) {
            console.log(`⚠️ Image failed: ${article.title.substring(0, 50)}...`);
        }
    }

    try {
        await axios.post(`${WAHA_URL}/api/sendText`, {
            chatId: CHANNEL_ID,
            text: caption,
            session: "default"
        }, axiosConfig);
        console.log(`✅ Sent Text: ${article.title.substring(0, 50)}...`);
    } catch (e) {
        console.error(`❌ Failed to send:`, e.response ? e.response.status : e.message);
    }
}

function getHotNewsKeywords() {
    return [
        'breaking', 'crisis', 'emergency', 'alert', 'urgent', 'dead', 'kill', 'attack', 'fire',
        'explosion', 'earthquake', 'flood', 'storm', 'hurricane', 'pandemic', 'outbreak',
        'protest', 'riot', 'strike', 'shutdown', 'resign', 'impeach', 'arrest', 'scandal',
        'leak', 'expose', 'whistleblower', 'hack', 'cyberattack', 'crash', 'accident',
        'election', 'result', 'winner', 'loser', 'victory', 'defeat', 'record', 'historic',
        'first', 'never before', 'unprecedented', 'shocking', 'surprising'
    ];
}

function isHotNews(article) {
    const keywords = getHotNewsKeywords();
    const title = (article.title || '').toLowerCase();
    const desc = (article.description || '').toLowerCase();
    return keywords.some(keyword => title.includes(keyword) || desc.includes(keyword));
}

async function runNewsJob() {
    console.log(`\n⏰ [${new Date().toLocaleTimeString()}] Checking for hot news...`);

    try {
        const articles = await fetchNews();
        const newArticles = articles.filter(a => !sentHistory.has(a.id));

        if (newArticles.length === 0) {
            console.log('📭 No new articles.');
            return;
        }

        const hotArticles = newArticles.filter(isHotNews);
        const regularArticles = newArticles.filter(a => !isHotNews(a));

        let queue = [];

        if (hotArticles.length > 0) {
            const sortedHot = hotArticles.sort((a, b) =>
                new Date(b.publishedAt) - new Date(a.publishedAt)
            );
            queue.push(sortedHot[0]);
        }

        const sortedRegular = regularArticles.sort((a, b) =>
            new Date(b.publishedAt) - new Date(a.publishedAt)
        );

        if (queue.length === 0 && sortedRegular.length > 0) {
            queue.push(sortedRegular[0]);
        } else if (sortedRegular.length > 0) {
            queue.push(sortedRegular[0]);
        }

        for (const article of queue) {
            await postArticle(article);
            sentHistory.add(article.id);
            await new Promise(r => setTimeout(r, 10000));
        }
    } catch (error) {
        console.error("🔥 Error:", error);
    }
}

cron.schedule('*/10 * * * *', () => {
    runNewsJob();
});

console.log('🚀 Hot News Channel Service Started');
console.log('⏱️  Posting hot news every 10 minutes');

setTimeout(() => {
    runNewsJob();
}, 3000);