const express = require("express");
const router = express.Router();
const Parser = require("rss-parser");

const parser = new Parser();

// Use your rss.app feed link
const RSS_FEED = "https://rss.app/feeds/GM4Esjp1er5JUZSi.xml";

// GET /api/news
router.get("/", async (req, res) => {
    try {
        const feed = await parser.parseURL(RSS_FEED);

        const news = (feed.items || []).map((item, index) => ({
            id: index + 1,
            title: item.title || "No Title",
            link: item.link || "#",
            pubDate: item.pubDate || null,
            source: feed.title || "RSS Feed",
            summary: item.contentSnippet || item.content || "",
        }));

        res.json(news);
    } catch (error) {
        console.error("Error fetching RSS feed:", error.message);
        res.status(500).json({ error: "Failed to fetch news" });
    }
});

module.exports = router;
