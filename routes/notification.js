const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { verifyToken } = require("../middleware/auth");

// All routes require authentication
router.use(verifyToken);

// GET /api/notifications - Get all notifications
router.get("/", notificationController.getNotifications);

// GET /api/notifications/unread-count - Get unread notifications count
router.get("/unread-count", notificationController.getUnreadCount);

// GET /api/notifications/stats - Get notification statistics
router.get("/stats", notificationController.getNotificationStats);

// PUT /api/notifications/:id/read - Mark notification as read
router.put("/:id/read", notificationController.markAsRead);

// PUT /api/notifications/mark-all-read - Mark all notifications as read
router.put("/mark-all-read", notificationController.markAllAsRead);

// DELETE /api/notifications/:id - Delete a notification
router.delete("/:id", notificationController.deleteNotification);

// POST /api/notifications - Create a notification (admin/system use)
router.post("/", notificationController.createNotification);

// POST /api/notifications/cleanup - Clean up expired notifications
router.post("/cleanup", notificationController.cleanupExpired);

module.exports = router;
