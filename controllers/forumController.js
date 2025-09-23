const { ForumPost, ForumStats } = require("../models/Forum");
const User = require("../models/User");

// Get all forum posts with pagination and filtering
exports.getForumPosts = async (req, res) => {
    try {
        const { category, page = 1, limit = 10, search } = req.query;
        const query = { isActive: true };

        if (category && category !== 'all') {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        const posts = await ForumPost.find(query)
            .populate('userId', 'username')
            .populate('comments.userId', 'username')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await ForumPost.countDocuments(query);

        res.json({
            posts,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalPosts: total
        });
    } catch (err) {
        console.error("Forum posts error:", err);
        res.status(500).json({ message: "Failed to fetch forum posts" });
    }
};

// Get forum statistics
exports.getForumStats = async (req, res) => {
    try {
        const stats = await ForumStats.findOne().sort({ createdAt: -1 });

        if (!stats) {
            // Generate initial stats if none exist
            const initialStats = await generateForumStats();
            return res.json(initialStats);
        }

        res.json(stats);
    } catch (err) {
        console.error("Forum stats error:", err);
        res.status(500).json({ message: "Failed to fetch forum statistics" });
    }
};

// Create a new forum post
exports.createForumPost = async (req, res) => {
    try {
        const { title, content, category, tags } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: "Title and content are required" });
        }

        const newPost = new ForumPost({
            userId: req.user.id,
            title,
            content,
            category: category || 'community',
            tags: tags || []
        });

        await newPost.save();
        await updateForumStats();

        // Populate user data for response
        await newPost.populate('userId', 'username');

        res.status(201).json(newPost);
    } catch (err) {
        console.error("Create post error:", err);
        res.status(500).json({ message: "Failed to create forum post" });
    }
};

// Get a specific forum post
exports.getForumPost = async (req, res) => {
    try {
        const post = await ForumPost.findById(req.params.id)
            .populate('userId', 'username')
            .populate('comments.userId', 'username');

        if (!post || !post.isActive) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Increment view count
        post.views += 1;
        await post.save();

        res.json(post);
    } catch (err) {
        console.error("Get post error:", err);
        res.status(500).json({ message: "Failed to fetch forum post" });
    }
};

// Add a comment to a forum post
exports.addComment = async (req, res) => {
    try {
        const { content } = req.body;
        const postId = req.params.id;

        if (!content) {
            return res.status(400).json({ message: "Comment content is required" });
        }

        const post = await ForumPost.findById(postId);
        if (!post || !post.isActive) {
            return res.status(404).json({ message: "Post not found" });
        }

        post.comments.push({
            userId: req.user.id,
            content
        });

        await post.save();
        await updateForumStats();

        // Populate user data for response
        await post.populate('comments.userId', 'username');

        res.json(post);
    } catch (err) {
        console.error("Add comment error:", err);
        res.status(500).json({ message: "Failed to add comment" });
    }
};

// Like/unlike a forum post
exports.toggleLike = async (req, res) => {
    try {
        const post = await ForumPost.findById(req.params.id);
        if (!post || !post.isActive) {
            return res.status(404).json({ message: "Post not found" });
        }

        const userId = req.user.id;
        const isLiked = post.likedBy ? post.likedBy.includes(userId) : false;

        if (isLiked) {
            // Unlike the post
            post.likes -= 1;
            post.likedBy = post.likedBy.filter(id => id.toString() !== userId);
        } else {
            // Like the post
            post.likes += 1;
            post.likedBy = post.likedBy || [];
            post.likedBy.push(userId);
        }

        await post.save();
        res.json({ likes: post.likes, isLiked: !isLiked });
    } catch (err) {
        console.error("Toggle like error:", err);
        res.status(500).json({ message: "Failed to toggle like" });
    }
};

// Update a forum post
exports.updateForumPost = async (req, res) => {
    try {
        const { title, content, category, tags } = req.body;
        const post = await ForumPost.findById(req.params.id);

        if (!post || !post.isActive) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check if user owns the post
        if (post.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to update this post" });
        }

        post.title = title || post.title;
        post.content = content || post.content;
        post.category = category || post.category;
        post.tags = tags || post.tags;

        await post.save();
        res.json(post);
    } catch (err) {
        console.error("Update post error:", err);
        res.status(500).json({ message: "Failed to update forum post" });
    }
};

// Delete a forum post
exports.deleteForumPost = async (req, res) => {
    try {
        const post = await ForumPost.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check if user owns the post or is admin
        if (post.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Not authorized to delete this post" });
        }

        post.isActive = false;
        await post.save();
        await updateForumStats();

        res.json({ message: "Post deleted successfully" });
    } catch (err) {
        console.error("Delete post error:", err);
        res.status(500).json({ message: "Failed to delete forum post" });
    }
};

// Helper function to generate initial forum statistics
async function generateForumStats() {
    const stats = {
        totalPosts: await ForumPost.countDocuments({ isActive: true }),
        totalComments: await ForumPost.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: null, total: { $sum: { $size: "$comments" } } } }
        ]).then(result => result[0]?.total || 0),
        totalViews: await ForumPost.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: null, total: { $sum: "$views" } } }
        ]).then(result => result[0]?.total || 0),
        categoryStats: {
            community: { posts: 0, comments: 0 },
            expert: { posts: 0, comments: 0 },
            cropcare: { posts: 0, comments: 0 },
            harvest: { posts: 0, comments: 0 },
            weather: { posts: 0, comments: 0 },
            marketplace: { posts: 0, comments: 0 },
            success: { posts: 0, comments: 0 }
        },
        lastUpdated: new Date()
    };

    // Calculate category statistics
    const categoryData = await ForumPost.aggregate([
        { $match: { isActive: true } },
        { $group: {
            _id: "$category",
            posts: { $sum: 1 },
            comments: { $sum: { $size: "$comments" } }
        }}
    ]);

    categoryData.forEach(cat => {
        if (stats.categoryStats[cat._id]) {
            stats.categoryStats[cat._id] = { posts: cat.posts, comments: cat.comments };
        }
    });

    // Save or update stats
    await ForumStats.findOneAndUpdate({}, stats, { upsert: true, new: true });

    return stats;
}

// Helper function to update forum statistics
async function updateForumStats() {
    await generateForumStats();
}
