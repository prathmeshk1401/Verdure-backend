const Schedule = require("../models/Schedule");
const Crop = require("../models/crop");

// Get all schedules for a user
exports.getSchedules = async (req, res) => {
    try {
        const { status, category, page = 1, limit = 10 } = req.query;
        const query = { userId: req.user.id };

        if (status && status !== 'all') {
            query.status = status;
        }

        if (category && category !== 'all') {
            query.category = category;
        }

        const schedules = await Schedule.find(query)
            .populate('cropId', 'name')
            .sort({ dueDate: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Schedule.countDocuments(query);

        res.json({
            schedules,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalSchedules: total
        });
    } catch (err) {
        console.error("Get schedules error:", err);
        res.status(500).json({ message: "Failed to fetch schedules" });
    }
};

// Get upcoming schedules (next 7 days)
exports.getUpcomingSchedules = async (req, res) => {
    try {
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const schedules = await Schedule.find({
            userId: req.user.id,
            dueDate: { $gte: now, $lte: nextWeek },
            status: { $in: ['pending', 'in-progress'] }
        })
        .populate('cropId', 'name')
        .sort({ dueDate: 1 })
        .limit(10);

        res.json(schedules);
    } catch (err) {
        console.error("Get upcoming schedules error:", err);
        res.status(500).json({ message: "Failed to fetch upcoming schedules" });
    }
};

// Create a new schedule
exports.createSchedule = async (req, res) => {
    try {
        const {
            title,
            description,
            dueDate,
            priority = 'medium',
            category = 'other',
            cropId,
            estimatedDuration,
            notes,
            reminders
        } = req.body;

        if (!title || !dueDate) {
            return res.status(400).json({ message: "Title and due date are required" });
        }

        // Validate crop exists if cropId is provided
        if (cropId) {
            const crop = await Crop.findById(cropId);
            if (!crop) {
                return res.status(404).json({ message: "Crop not found" });
            }
        }

        const newSchedule = new Schedule({
            userId: req.user.id,
            title,
            description,
            dueDate,
            priority,
            category,
            cropId,
            estimatedDuration,
            notes,
            reminders: reminders || []
        });

        await newSchedule.save();

        // Populate crop data for response
        await newSchedule.populate('cropId', 'name');

        res.status(201).json(newSchedule);
    } catch (err) {
        console.error("Create schedule error:", err);
        res.status(500).json({ message: "Failed to create schedule" });
    }
};

// Update a schedule
exports.updateSchedule = async (req, res) => {
    try {
        const { title, description, dueDate, priority, category, status, estimatedDuration, notes, reminders } = req.body;
        const schedule = await Schedule.findById(req.params.id);

        if (!schedule) {
            return res.status(404).json({ message: "Schedule not found" });
        }

        // Check if user owns the schedule
        if (schedule.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to update this schedule" });
        }

        // Update fields
        schedule.title = title || schedule.title;
        schedule.description = description || schedule.description;
        schedule.dueDate = dueDate || schedule.dueDate;
        schedule.priority = priority || schedule.priority;
        schedule.category = category || schedule.category;
        schedule.status = status || schedule.status;
        schedule.estimatedDuration = estimatedDuration || schedule.estimatedDuration;
        schedule.notes = notes || schedule.notes;
        schedule.reminders = reminders || schedule.reminders;

        // If marking as completed, set completedAt
        if (status === 'completed' && schedule.status !== 'completed') {
            schedule.completedAt = new Date();
            schedule.actualDuration = estimatedDuration || schedule.estimatedDuration;
        }

        await schedule.save();

        // Populate crop data for response
        await schedule.populate('cropId', 'name');

        res.json(schedule);
    } catch (err) {
        console.error("Update schedule error:", err);
        res.status(500).json({ message: "Failed to update schedule" });
    }
};

// Mark schedule as completed
exports.completeSchedule = async (req, res) => {
    try {
        const { actualDuration } = req.body;
        const schedule = await Schedule.findById(req.params.id);

        if (!schedule) {
            return res.status(404).json({ message: "Schedule not found" });
        }

        // Check if user owns the schedule
        if (schedule.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to complete this schedule" });
        }

        schedule.status = 'completed';
        schedule.completedAt = new Date();
        schedule.actualDuration = actualDuration || schedule.estimatedDuration;

        await schedule.save();

        // Populate crop data for response
        await schedule.populate('cropId', 'name');

        res.json(schedule);
    } catch (err) {
        console.error("Complete schedule error:", err);
        res.status(500).json({ message: "Failed to complete schedule" });
    }
};

// Delete a schedule
exports.deleteSchedule = async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.id);

        if (!schedule) {
            return res.status(404).json({ message: "Schedule not found" });
        }

        // Check if user owns the schedule
        if (schedule.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to delete this schedule" });
        }

        await Schedule.findByIdAndDelete(req.params.id);
        res.json({ message: "Schedule deleted successfully" });
    } catch (err) {
        console.error("Delete schedule error:", err);
        res.status(500).json({ message: "Failed to delete schedule" });
    }
};

// Get schedule statistics
exports.getScheduleStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();

        const [
            totalSchedules,
            completedSchedules,
            pendingSchedules,
            overdueSchedules,
            thisWeekSchedules
        ] = await Promise.all([
            Schedule.countDocuments({ userId }),
            Schedule.countDocuments({ userId, status: 'completed' }),
            Schedule.countDocuments({ userId, status: 'pending' }),
            Schedule.countDocuments({
                userId,
                status: { $in: ['pending', 'in-progress'] },
                dueDate: { $lt: now }
            }),
            Schedule.countDocuments({
                userId,
                dueDate: {
                    $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
                    $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
                }
            })
        ]);

        // Get category breakdown
        const categoryStats = await Schedule.aggregate([
            { $match: { userId } },
            { $group: { _id: "$category", count: { $sum: 1 } } }
        ]);

        res.json({
            totalSchedules,
            completedSchedules,
            pendingSchedules,
            overdueSchedules,
            thisWeekSchedules,
            completionRate: totalSchedules > 0 ? Math.round((completedSchedules / totalSchedules) * 100) : 0,
            categoryStats: categoryStats.reduce((acc, cat) => {
                acc[cat._id] = cat.count;
                return acc;
            }, {})
        });
    } catch (err) {
        console.error("Schedule stats error:", err);
        res.status(500).json({ message: "Failed to fetch schedule statistics" });
    }
};
