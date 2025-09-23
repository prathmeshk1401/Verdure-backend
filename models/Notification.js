const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['plan', 'payment', 'security', 'update', 'crop', 'weather', 'system'],
        required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Object }, // Additional data related to the notification
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    expiresAt: { type: Date }, // Auto-delete after this date
    actionUrl: { type: String }, // URL to redirect when notification is clicked
    metadata: {
        source: { type: String }, // What triggered this notification
        referenceId: { type: mongoose.Schema.Types.ObjectId }, // Reference to related object
        ipAddress: { type: String },
        userAgent: { type: String }
    }
}, { timestamps: true });

// Index for efficient queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Notification", notificationSchema);
