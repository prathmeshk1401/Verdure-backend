const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    dueDate: { type: Date, required: true },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    category: {
        type: String,
        enum: ['irrigation', 'fertilizer', 'harvest', 'planting', 'pest-control', 'soil-check', 'other'],
        default: 'other'
    },
    cropId: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop' },
    estimatedDuration: { type: Number }, // in minutes
    actualDuration: { type: Number }, // in minutes
    notes: { type: String },
    reminders: [{
        time: { type: Date },
        sent: { type: Boolean, default: false }
    }],
    completedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model("Schedule", scheduleSchema);
