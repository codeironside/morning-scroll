export const config = {
    app: {
        port: process.env.PORT || 2345,
        base_url: process.env.BASE_URL || "http://localhost:3000"
    },

    waha_whatapp_api: process.env.waha_whatsapp_api,
    rss_feed: {
        "Nigeria": [
            "https://www.vanguardngr.com/feed/",
            "https://punchng.com/feed/",
            "https://dailypost.ng/feed/",
            "https://www.channelstv.com/feed/",
            "https://leadership.ng/feed/",
            "https://businessday.ng/feed/",
            "https://tribuneonlineng.com/feed/"
        ],
        "World News": [
            "http://rss.cnn.com/rss/edition.rss",
            "http://feeds.bbci.co.uk/news/world/rss.xml",
            "https://www.aljazeera.com/xml/rss/all.xml",
            "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
            "https://moxie.foxnews.com/google-publisher/world.xml", // Fox News World
            "https://www.japantimes.co.jp/feed/",
            "https://www.france24.com/en/rss",
            "https://feeds.washingtonpost.com/rss/world"
        ],
        "Technology": [
            "https://www.theverge.com/rss/index.xml",
            "https://techcrunch.com/feed/",
            "https://www.wired.com/feed/rss",
            "https://arstechnica.com/feed/",
            "https://www.engadget.com/rss.xml"
        ],
        "Sports": [
            "https://www.skysports.com/rss/12040",
            "https://www.espn.com/espn/rss/news", // Reliable Global Sports
            "https://api.foxsports.com/v2/content/optimized-rss?partnerKey=MB0Wehpmuj2lUhuRhQaafhBjAJqaPU244mlTDK1i&size=30&tags=fs/soccer,fs/nfl,fs/nba", // Fox Sports Mixed
            "https://www.cbssports.com/rss/headlines/"
        ],
        "Finance": [
            "https://search.cnbc.com/rs/search/view.xml?partnerId=2000&keywords=finance",
            "https://www.ft.com/?format=rss",
            "https://feeds.bloomberg.com/markets/news.rss"
        ],
        "Entertainment": [
            "https://variety.com/feed/",
            "https://www.hollywoodreporter.com/feed/",
            "https://www.tmz.com/rss.xml",
            "https://www.lindaikejisblog.com/feed" // Nigeria Entertainment
        ]
    }
}