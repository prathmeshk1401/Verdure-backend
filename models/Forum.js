const mongoose = require("mongoose");

const forumPostSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: {
        type: String,
        enum: ['community', 'expert', 'cropcare', 'harvest', 'weather', 'marketplace', 'success'],
        default: 'community'
    },
    tags: [{ type: String }],
    likes: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    comments: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const forumStatsSchema = new mongoose.Schema({
    totalPosts: { type: Number, default: 0 },
    totalComments: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
    categoryStats: {
        community: { posts: Number, comments: Number },
        expert: { posts: Number, comments: Number },
        cropcare: { posts: Number, comments: Number },
        harvest: { posts: Number, comments: Number },
        weather: { posts: Number, comments: Number },
        marketplace: { posts: Number, comments: Number },
        success: { posts: Number, comments: Number }
    },
    lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = {
    ForumPost: mongoose.model("ForumPost", forumPostSchema),
    ForumStats: mongoose.model("ForumStats", forumStatsSchema)
};
