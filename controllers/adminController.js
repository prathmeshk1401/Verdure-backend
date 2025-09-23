const User = require("../models/User");
const Crop = require("../models/crop");
const Schedule = require("../models/Schedule");
const Notification = require("../models/Notification");
const { AnalyticsData } = require("../models/Analytics");

// GET /api/users
exports.getUsers = async (req, res) => {
    try {
        const filter = {};
        if (req.query.role) filter.role = req.query.role;
        const users = await User.find(filter).select("username email role createdAt updatedAt lastLogin dashboardData");
        res.json(users);
    } catch (err) {
        console.error("Get users error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// PATCH /api/users/:id
exports.updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!role || !["user", "admin"].includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        const updated = await User.findByIdAndUpdate(id, { role }, { new: true }).select("username email role");
        if (!updated) return res.status(404).json({ message: "User not found" });
        res.json(updated);
    } catch (err) {
        console.error("Update role error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/users/summary
exports.getUserSummary = async (req, res) => {
    try {
        const total = await User.countDocuments();
        const admins = await User.countDocuments({ role: "admin" });
        const active = await User.countDocuments({ lastLogin: { $gte: new Date(Date.now() - 7*24*60*60*1000) } });
        res.json({ total, admins, active });
    } catch (err) {
        console.error("User summary error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/users/:id/dashboard - admin view of a user's dashboard summary
exports.getUserDashboardSummary = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select("_id username email createdAt");
        if (!user) return res.status(404).json({ message: "User not found" });

        const userCrops = await Crop.find({ userId: id });
        const userSchedules = await Schedule.find({ userId: id }).sort({ createdAt: -1 });

        const totalCrops = userCrops.length;
        const activeCrops = userCrops.filter(crop => crop.status !== 'harvested').length;
        const totalIncome = userCrops.reduce((sum, crop) => sum + (crop.totalIncome || 0), 0);
        const totalExpenses = userCrops.reduce((sum, crop) => sum + (crop.expenses || 0), 0);
        const netProfit = totalIncome - totalExpenses;
        const profitMargin = totalIncome > 0 ? Math.round((netProfit * 100) / totalIncome) : 0;

        // Simple progress trend (last 6 items from schedules or crops by date)
        const months = ['Apr','May','Jun','Jul','Aug','Sep'];
        const progressTrend = months.map((m, idx) => ({ month: m, progress: Math.round((idx + 1) * (activeCrops > 0 ? (100 * activeCrops) / (totalCrops || 1) : 0) / months.length) }));

        res.json({
            user: { id: user._id, username: user.username, email: user.email },
            totals: { totalCrops, activeCrops, totalIncome, totalExpenses, netProfit, profitMargin },
            progressTrend
        });
    } catch (err) {
        console.error("User dashboard summary error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

