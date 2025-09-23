const Notification = require("../models/Notification");

// Get all notifications for a user
exports.getNotifications = async (req, res) => {
    try {
        const { isRead, type, page = 1, limit = 20 } = req.query;
        const query = { userId: req.user.id };

        if (isRead !== undefined) {
            query.isRead = isRead === 'true';
        }

        if (type && type !== 'all') {
            query.type = type;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Notification.countDocuments(query);

        res.json({
            notifications,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalNotifications: total,
            unreadCount: await Notification.countDocuments({ userId: req.user.id, isRead: false })
        });
    } catch (err) {
        console.error("Get notifications error:", err);
        res.status(500).json({ message: "Failed to fetch notifications" });
    }
};

// Get unread notifications count
exports.getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            userId: req.user.id,
            isRead: false
        });
        res.json({ unreadCount: count });
    } catch (err) {
        console.error("Get unread count error:", err);
        res.status(500).json({ message: "Failed to fetch unread count" });
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        // Check if user owns the notification
        if (notification.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to update this notification" });
        }

        notification.isRead = true;
        notification.readAt = new Date();
        await notification.save();

        res.json(notification);
    } catch (err) {
        console.error("Mark as read error:", err);
        res.status(500).json({ message: "Failed to mark notification as read" });
    }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
    try {
        const result = await Notification.updateMany(
            { userId: req.user.id, isRead: false },
            {
                isRead: true,
                readAt: new Date()
            }
        );

        res.json({
            message: "All notifications marked as read",
            updatedCount: result.modifiedCount
        });
    } catch (err) {
        console.error("Mark all as read error:", err);
        res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        // Check if user owns the notification
        if (notification.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to delete this notification" });
        }

        await Notification.findByIdAndDelete(req.params.id);
        res.json({ message: "Notification deleted successfully" });
    } catch (err) {
        console.error("Delete notification error:", err);
        res.status(500).json({ message: "Failed to delete notification" });
    }
};

// Create a notification (for system use)
exports.createNotification = async (req, res) => {
    try {
        const {
            userId,
            type,
            title,
            message,
            priority = 'medium',
            data,
            actionUrl,
            expiresAt
        } = req.body;

        if (!userId || !type || !title || !message) {
            return res.status(400).json({ message: "User ID, type, title, and message are required" });
        }

        const notification = new Notification({
            userId,
            type,
            title,
            message,
            priority,
            data,
            actionUrl,
            expiresAt
        });

        await notification.save();
        res.status(201).json(notification);
    } catch (err) {
        console.error("Create notification error:", err);
        res.status(500).json({ message: "Failed to create notification" });
    }
};

// Get notification statistics
exports.getNotificationStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const [
            totalNotifications,
            readNotifications,
            unreadNotifications,
            notificationsByType
        ] = await Promise.all([
            Notification.countDocuments({ userId }),
            Notification.countDocuments({ userId, isRead: true }),
            Notification.countDocuments({ userId, isRead: false }),
            Notification.aggregate([
                { $match: { userId } },
                { $group: { _id: "$type", count: { $sum: 1 } } }
            ])
        ]);

        res.json({
            totalNotifications,
            readNotifications,
            unreadNotifications,
            readRate: totalNotifications > 0 ? Math.round((readNotifications / totalNotifications) * 100) : 0,
            notificationsByType: notificationsByType.reduce((acc, type) => {
                acc[type._id] = type.count;
                return acc;
            }, {})
        });
    } catch (err) {
        console.error("Notification stats error:", err);
        res.status(500).json({ message: "Failed to fetch notification statistics" });
    }
};

// Clean up expired notifications
exports.cleanupExpired = async (req, res) => {
    try {
        const now = new Date();
        const result = await Notification.deleteMany({
            expiresAt: { $lt: now }
        });

        res.json({
            message: "Expired notifications cleaned up",
            deletedCount: result.deletedCount
        });
    } catch (err) {
        console.error("Cleanup expired notifications error:", err);
        res.status(500).json({ message: "Failed to cleanup expired notifications" });
    }
};
