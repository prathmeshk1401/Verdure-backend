const Story = require("../models/story");

exports.getStories = async (req, res) => {
    try {
        const stories = await Story.find();
        res.json(stories);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch stories" });
    }
};
