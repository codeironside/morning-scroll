import cron from 'node-cron';
import axios from 'axios';
import { fetchNews } from '../news/index.js';

const WAHA_URL = 'http://localhost:3000';
const CHANNEL_ID = '120363409113673268@newsletter';
const WAHA_API_KEY = 'ceb57765ed654e6894e329a00f8edb77'; // Authenticates you

// Memory to store IDs of articles we have already sent
const sentHistory = new Set();

async function postArticle(article) {
    const caption = `*${article.title}*\n\n${article.description.substring(0, 150)}...\n\n🔗 _Read more:_ ${article.url}`;

    // Common config for authentication
    const axiosConfig = {
        headers: {
            'X-Api-Key': WAHA_API_KEY,
            'Content-Type': 'application/json'
        }
    };

    // 1. Try sending Image
    if (article.image) {
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
            }, axiosConfig); // <--- Passed auth headers here

            console.log(`✅ Sent Image: ${article.title}`);
            return;
        } catch (e) {
            console.log(`⚠️ Image failed for ${article.title}, failing over to text...`);
        }
    }

    // 2. Fallback to Text (if image fails or doesn't exist)
    try {
        await axios.post(`${WAHA_URL}/api/sendText`, {
            chatId: CHANNEL_ID,
            text: caption,
            session: "default"
        }, axiosConfig); // <--- Passed auth headers here

        console.log(`✅ Sent Text: ${article.title}`);
    } catch (e) {
        // Log the specific error status (e.g. 401, 403, 500)
        console.error(`❌ Failed to send ${article.title}:`, e.response ? e.response.status : e.message);
    }
}

async function runNewsJob() {
    console.log(`\n⏰ [${new Date().toLocaleTimeString()}] Checking for news...`);

    try {
        const articles = await fetchNews();

        // Filter: Only keep articles whose ID is NOT in our history
        const newArticles = articles.filter(a => !sentHistory.has(a.id));

        if (newArticles.length === 0) {
            console.log('📭 No new articles.');
            return;
        }

        // Take the top 5, reverse them so the oldest of the batch sends first (chronological order)
        const queue = newArticles.slice(0, 5).reverse();

        for (const article of queue) {
            await postArticle(article);

            // Add to history so it never gets sent again
            sentHistory.add(article.id);

            // Wait 5 seconds between messages to prevent spam blocks
            await new Promise(r => setTimeout(r, 5000));
        }
    } catch (error) {
        console.error("🔥 Error running news job:", error);
    }
}

// Schedule: Run every 2 minutes
cron.schedule('*/2 * * * *', () => {
    runNewsJob();
});

console.log('🚀 Service started. Will post to WhatsApp every 2 minutes.');

// Run immediately on start to test
runNewsJob();