const User = require("../models/User");
// Ensure correct case for cross-platform compatibility
const Crop = require("../models/crop");
// Payment model may be absent; guard require
let Payment = null;
try {
    Payment = require("../models/Payment");
} catch (e) {
    Payment = null;
}

// Import additional models for real data
const Schedule = require("../models/Schedule");
const Notification = require("../models/Notification");
const { AnalyticsData } = require("../models/Analytics");

exports.getDashboard = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("dashboardData username email createdAt");
        if (!user) return res.status(404).json({ message: "User not found" });

        // Get real-time data from database
        const userCrops = await Crop.find({ userId: req.user.id });
        const userSchedules = await Schedule.find({ userId: req.user.id }).sort({ createdAt: -1 });
        const userNotifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(5);
        const userAnalytics = await AnalyticsData.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(5);

        const totalCrops = userCrops.length;
        const activeCrops = userCrops.filter(crop => crop.status !== 'harvested').length;

        // Calculate total income and expenses
        const totalIncome = userCrops.reduce((sum, crop) => sum + (crop.totalIncome || 0), 0);
        const totalExpenses = userCrops.reduce((sum, crop) => sum + (crop.expenses || 0), 0);
        const netProfit = totalIncome - totalExpenses;

        // Calculate average soil health from actual crop data
        const cropsWithSoilHealth = userCrops.filter(crop => crop.soilHealth);
        const avgSoilHealth = cropsWithSoilHealth.length > 0
            ? cropsWithSoilHealth.reduce((sum, crop) => sum + crop.soilHealth, 0) / cropsWithSoilHealth.length
            : 75; // Default value

        // Get real-time stats
        const realTimeStats = {
            crops: activeCrops,
            totalCrops: totalCrops,
            soilHealth: `${Math.round(avgSoilHealth)}%`,
            totalIncome: `₹${totalIncome.toLocaleString()}`,
            totalExpenses: `₹${totalExpenses.toLocaleString()}`,
            netProfit: `₹${netProfit.toLocaleString()}`,
            profitMargin: totalIncome > 0 ? `${Math.round((netProfit / totalIncome) * 100)}%` : "0%",
            nextTask: getNextTask(userSchedules),
            analytics: getAnalyticsData(userAnalytics, totalIncome, totalExpenses)
        };

        // Get real activities from database
        const recentActivities = getRecentActivities(userCrops, userSchedules, userNotifications, user.createdAt);

        // Get real weather alerts from notifications
        const weatherAlerts = getWeatherAlerts(userNotifications);

        // Get real AI recommendations based on actual data
        const recommendations = getAIRecommendations(userCrops, avgSoilHealth, userSchedules);

        // Get real upcoming tasks from schedules
        const upcomingTasks = getUpcomingTasks(userSchedules);

        const dashboardData = {
            stats: realTimeStats,
            preferences: user.dashboardData?.preferences || {},
            activities: recentActivities,
            weatherAlerts: weatherAlerts,
            recommendations: recommendations,
            upcomingTasks: upcomingTasks,
            lastUpdated: new Date().toISOString()
        };

        res.json(dashboardData);
    } catch (err) {
        console.error("Dashboard error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Helper functions for getting real-time data from database
function getNextTask(schedules) {
    if (schedules.length === 0) return "No upcoming tasks";

    // Check by status rather than a non-existent boolean `completed`
    const nextTask = schedules.find(schedule => schedule.status !== 'completed' && new Date(schedule.dueDate) > new Date());
    return nextTask ? `${nextTask.title} - Due ${new Date(nextTask.dueDate).toLocaleDateString()}` : "All tasks completed";
}

function getAnalyticsData(analytics, totalIncome, totalExpenses) {
    if (analytics.length === 0) return "No analytics data yet";

    const latestAnalytics = analytics[0];
    // Derive from AnalyticsData.metrics structure
    const totalRevenue = latestAnalytics.metrics?.totalRevenue ?? totalIncome;
    const expenses = latestAnalytics.metrics?.totalExpenses ?? totalExpenses;
    const cropCount = latestAnalytics.metrics?.totalCrops || 1;
    const avgYield = totalRevenue / cropCount;
    const profitMargin = totalRevenue > 0 ? Math.round(((totalRevenue - expenses) * 100) / totalRevenue) : 0;

    return `Avg Yield: ₹${Math.round(avgYield).toLocaleString()} | Profit Margin: ${profitMargin}%`;
}

function getRecentActivities(crops, schedules, notifications, userCreatedAt) {
    const activities = [];
    const now = new Date();

    // Add user registration activity
    activities.push({
        id: 1,
        text: "Joined Verdure platform",
        time: userCreatedAt,
        type: "system"
    });

    // Add recent crop activities
    crops.slice(0, 2).forEach((crop, index) => {
        activities.push({
            id: index + 2,
            text: `Added ${crop.name} crop`,
            time: crop.createdAt,
            type: "crop"
        });
    });

    // Add recent schedule activities
    schedules.slice(0, 2).forEach((schedule, index) => {
        activities.push({
            id: crops.length + index + 3,
            text: `Scheduled: ${schedule.title}`,
            time: schedule.createdAt,
            type: "schedule"
        });
    });

    // Add recent notifications
    notifications.slice(0, 1).forEach((notification, index) => {
        activities.push({
            id: crops.length + schedules.length + index + 4,
            text: notification.message,
            time: notification.createdAt,
            type: "notification"
        });
    });

    return activities.sort((a, b) => new Date(b.time) - new Date(a.time));
}

function getWeatherAlerts(notifications) {
    const weatherNotifications = notifications.filter(notification =>
        notification.type === 'weather' ||
        notification.message.toLowerCase().includes('weather') ||
        notification.message.toLowerCase().includes('rain') ||
        notification.message.toLowerCase().includes('temperature')
    );

    return weatherNotifications.slice(0, 2).map(notification => notification.message);
}

function getAIRecommendations(crops, soilHealth, schedules) {
    const recommendations = [];

    // Soil health recommendations
    if (soilHealth < 70) {
        recommendations.push("💡 Soil health is low - consider adding organic compost");
    }

    // Crop diversity recommendations
    if (crops.length === 0) {
        recommendations.push("💡 Start by adding your first crop to track progress");
    } else if (crops.length < 3) {
        recommendations.push("💡 Consider diversifying with more crop varieties");
    }

    // Schedule-based recommendations
    const pendingTasks = schedules.filter(schedule => schedule.status !== 'completed').length;
    if (pendingTasks > 5) {
        recommendations.push("💡 You have multiple pending tasks - prioritize based on due dates");
    }

    // General farming recommendations
    recommendations.push("💡 Water your crops early morning for better absorption");
    recommendations.push("💡 Check for pests regularly during growing season");

    return recommendations.slice(0, 3);
}

function getUpcomingTasks(schedules) {
    const now = new Date();
    const upcoming = schedules
        .filter(schedule => schedule.status !== 'completed' && new Date(schedule.dueDate) > now)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 3);

    return upcoming.map((schedule, index) => ({
        id: index + 1,
        text: schedule.title,
        date: schedule.dueDate,
        priority: schedule.priority || "medium"
    }));
}

exports.updateDashboard = async (req, res) => {
    try {
        const { stats, preferences } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Ensure dashboardData exists to avoid undefined property errors
        if (!user.dashboardData) user.dashboardData = { stats: {}, preferences: {} };
        user.dashboardData.stats = stats || user.dashboardData.stats;
        user.dashboardData.preferences = preferences || user.dashboardData.preferences;

        await user.save();
        res.json({ message: "Dashboard updated", dashboardData: user.dashboardData });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.getAdminStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: "user" });
        const totalCrops = await Crop.countDocuments();
        const totalPayments = Payment ? await Payment.countDocuments() : 0;
        const revenueAgg = Payment
            ? await Payment.aggregate([
                { $match: { status: "Paid" } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ])
            : [];

        // Get detailed user statistics
        const activeUsers = await User.countDocuments({
            role: "user",
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });

        // Get crop statistics
        const cropsByStatus = await Crop.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        // Get total income and expenses from all crops
        const totalIncome = await Crop.aggregate([
            { $group: { _id: null, total: { $sum: "$totalIncome" } } }
        ]);

        const totalExpenses = await Crop.aggregate([
            { $group: { _id: null, total: { $sum: "$expenses" } } }
        ]);

        // Get recent user registrations
        const recentUsers = await User.find({ role: "user" })
            .sort({ createdAt: -1 })
            .limit(5)
            .select("username email createdAt");

        // Get recent crop activities
        const recentCrops = await Crop.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("userId", "username")
            .select("name status totalIncome expenses createdAt");

        // Build trends (basic last-6-month placeholders if real analytics absent)
        const months = ['Apr','May','Jun','Jul','Aug','Sep'];
        const userTrend = months.map((m, idx) => ({ month: m, total: totalUsers, active: idx === months.length - 1 ? activeUsers : Math.round(activeUsers * (idx+1)/months.length) }));
        const financialTrend = months.map((m, idx) => ({ month: m, net: Math.round(((totalIncome[0]?.total || 0) - (totalExpenses[0]?.total || 0)) * (idx+1)/months.length) }));

        res.json({
            totalUsers,
            activeUsers,
            totalCrops,
            totalPayments,
            revenue: revenueAgg[0]?.total || 0,
            totalIncome: totalIncome[0]?.total || 0,
            totalExpenses: totalExpenses[0]?.total || 0,
            netProfit: (totalIncome[0]?.total || 0) - (totalExpenses[0]?.total || 0),
            cropsByStatus: cropsByStatus.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            userTrend,
            financialTrend,
            recentUsers,
            recentCrops,
            lastUpdated: new Date().toISOString()
        });
    } catch (err) {
        console.error("Admin stats error:", err);
        res.status(500).json({ message: "Failed to fetch admin stats" });
    }
};