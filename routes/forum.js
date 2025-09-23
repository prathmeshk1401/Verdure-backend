const express = require("express");
const router = express.Router();
const forumController = require("../controllers/forumController");
const { verifyToken } = require("../middleware/auth");

// All routes require authentication
router.use(verifyToken);

// GET /api/forum - Get all forum posts
router.get("/", forumController.getForumPosts);

// GET /api/forum/stats - Get forum statistics
router.get("/stats", forumController.getForumStats);

// POST /api/forum - Create a new forum post
router.post("/", forumController.createForumPost);

// GET /api/forum/:id - Get a specific forum post
router.get("/:id", forumController.getForumPost);

// POST /api/forum/:id/comments - Add a comment to a forum post
router.post("/:id/comments", forumController.addComment);

// POST /api/forum/:id/like - Like/unlike a forum post
router.post("/:id/like", forumController.toggleLike);

// PUT /api/forum/:id - Update a forum post
router.put("/:id", forumController.updateForumPost);

// DELETE /api/forum/:id - Delete a forum post
router.delete("/:id", forumController.deleteForumPost);

module.exports = router;
