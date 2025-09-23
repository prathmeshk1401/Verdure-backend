const { AnalyticsData, AnalyticsSummary } = require("../models/Analytics");
const Crop = require("../models/crop");
const User = require("../models/User");

// Get analytics data for a specific date range
exports.getAnalyticsData = async (req, res) => {
    try {
        const { startDate, endDate, period = 'daily' } = req.query;
        const userId = req.user.id;

        let start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        let end = endDate ? new Date(endDate) : new Date();

        const analyticsData = await AnalyticsData.find({
            userId,
            date: { $gte: start, $lte: end }
        }).sort({ date: 1 });

        res.json(analyticsData);
    } catch (err) {
        console.error("Get analytics data error:", err);
        res.status(500).json({ message: "Failed to fetch analytics data" });
    }
};

// Get analytics summary for a period
exports.getAnalyticsSummary = async (req, res) => {
    try {
        const { period = 'monthly' } = req.query;
        const userId = req.user.id;

        let startDate, endDate;

        switch (period) {
            case 'daily':
                startDate = new Date();
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date();
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'weekly':
                const now = new Date();
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                endDate = now;
                break;
            case 'monthly':
                const monthStart = new Date();
                monthStart.setDate(1);
                monthStart.setHours(0, 0, 0, 0);
                startDate = monthStart;
                endDate = new Date();
                break;
            case 'yearly':
                const yearStart = new Date();
                yearStart.setMonth(0, 1);
                yearStart.setHours(0, 0, 0, 0);
                startDate = yearStart;
                endDate = new Date();
                break;
            default:
                return res.status(400).json({ message: "Invalid period" });
        }

        // Check if summary already exists
        let summary = await AnalyticsSummary.findOne({
            userId,
            period,
            startDate,
            endDate
        });

        if (!summary) {
            // Generate new summary
            summary = await generateAnalyticsSummary(userId, period, startDate, endDate);
        }

        res.json(summary);
    } catch (err) {
        console.error("Get analytics summary error:", err);
        res.status(500).json({ message: "Failed to fetch analytics summary" });
    }
};

// Get dashboard analytics (key metrics)
exports.getDashboardAnalytics = async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Get user's crops
        const crops = await Crop.find({ userId });

        // Calculate real-time metrics
        const totalCrops = crops.length;
        const activeCrops = crops.filter(crop => crop.status !== 'harvested').length;

        const totalIncome = crops.reduce((sum, crop) => sum + (crop.totalIncome || 0), 0);
        const totalExpenses = crops.reduce((sum, crop) => sum + (crop.expenses || 0), 0);
        const netProfit = totalIncome - totalExpenses;

        // Calculate growth rate (simplified)
        const growthRate = totalCrops > 0 ? Math.round((activeCrops / totalCrops) * 100) : 0;

        // Get recent analytics data for trends
        const recentData = await AnalyticsData.find({
            userId,
            date: { $gte: thirtyDaysAgo }
        }).sort({ date: -1 }).limit(7);

        // Generate chart data
        const chartData = {
            labels: recentData.map(data => data.date.toLocaleDateString()),
            datasets: [
                {
                    label: "Revenue (₹)",
                    data: recentData.map(data => data.metrics.totalRevenue),
                    borderColor: "#2c662d",
                    backgroundColor: "rgba(44, 102, 45, 0.2)",
                    tension: 0.4,
                },
                {
                    label: "Expenses (₹)",
                    data: recentData.map(data => data.metrics.totalExpenses),
                    borderColor: "#dc3545",
                    backgroundColor: "rgba(220, 53, 69, 0.2)",
                    tension: 0.4,
                }
            ],
        };

        const analytics = {
            metrics: {
                totalCrops,
                activeCrops,
                totalYield: crops.reduce((sum, crop) => sum + (crop.totalIncome || 0), 0), // Simplified
                totalRevenue: totalIncome,
                totalExpenses: totalExpenses,
                netProfit,
                growthRate,
                soilHealth: Math.max(60, Math.min(95, 85 + Math.random() * 10)), // Simulated
                harvestEfficiency: Math.max(70, Math.min(95, 80 + Math.random() * 15)) // Simulated
            },
            chartData,
            recentActivity: recentData.length > 0 ? recentData[0].activities.slice(0, 5) : [],
            cropBreakdown: crops.slice(0, 5).map(crop => ({
                cropId: crop._id,
                cropName: crop.name,
                yield: crop.totalIncome || 0,
                revenue: crop.totalIncome || 0,
                expenses: crop.expenses || 0
            }))
        };

        res.json(analytics);
    } catch (err) {
        console.error("Get dashboard analytics error:", err);
        res.status(500).json({ message: "Failed to fetch dashboard analytics" });
    }
};

// Record analytics data
exports.recordAnalyticsData = async (req, res) => {
    try {
        const userId = req.user.id;
        const { date, metrics, cropBreakdown, weatherData, activities } = req.body;

        if (!date || !metrics) {
            return res.status(400).json({ message: "Date and metrics are required" });
        }

        const analyticsData = new AnalyticsData({
            userId,
            date: new Date(date),
            metrics,
            cropBreakdown: cropBreakdown || [],
            weatherData: weatherData || {},
            activities: activities || []
        });

        await analyticsData.save();
        res.status(201).json(analyticsData);
    } catch (err) {
        console.error("Record analytics data error:", err);
        res.status(500).json({ message: "Failed to record analytics data" });
    }
};

// Get crop performance analytics
exports.getCropPerformance = async (req, res) => {
    try {
        const userId = req.user.id;
        const { cropId } = req.params;

        const crops = cropId ?
            await Crop.find({ userId, _id: cropId }) :
            await Crop.find({ userId });

        const performanceData = await Promise.all(crops.map(async (crop) => {
            const analytics = await AnalyticsData.find({
                userId,
                'cropBreakdown.cropId': crop._id
            }).sort({ date: -1 }).limit(10);

            const totalRevenue = crop.totalIncome || 0;
            const totalExpenses = crop.expenses || 0;
            const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue * 100) : 0;

            return {
                cropId: crop._id,
                cropName: crop.name,
                totalRevenue,
                totalExpenses,
                profitMargin,
                status: crop.status,
                plantedDate: crop.plantedDate,
                expectedHarvestDate: crop.expectedHarvestDate,
                area: crop.area,
                location: crop.location,
                recentAnalytics: analytics
            };
        }));

        res.json(performanceData);
    } catch (err) {
        console.error("Get crop performance error:", err);
        res.status(500).json({ message: "Failed to fetch crop performance" });
    }
};

// Helper function to generate analytics summary
async function generateAnalyticsSummary(userId, period, startDate, endDate) {
    const crops = await Crop.find({ userId });
    const analyticsData = await AnalyticsData.find({
        userId,
        date: { $gte: startDate, $lte: endDate }
    });

    // Calculate summary metrics
    const totalRevenue = analyticsData.reduce((sum, data) => sum + data.metrics.totalRevenue, 0);
    const totalExpenses = analyticsData.reduce((sum, data) => sum + data.metrics.totalExpenses, 0);
    const netProfit = totalRevenue - totalExpenses;
    const averageGrowthRate = analyticsData.length > 0 ?
        analyticsData.reduce((sum, data) => sum + data.metrics.growthRate, 0) / analyticsData.length : 0;

    // Find best performing crop
    const cropPerformance = {};
    analyticsData.forEach(data => {
        data.cropBreakdown.forEach(crop => {
            if (!cropPerformance[crop.cropName]) {
                cropPerformance[crop.cropName] = { revenue: 0, count: 0 };
            }
            cropPerformance[crop.cropName].revenue += crop.revenue;
            cropPerformance[crop.cropName].count += 1;
        });
    });

    const bestPerformingCrop = Object.entries(cropPerformance)
        .sort(([,a], [,b]) => b.revenue - a.revenue)[0]?.[0] || "None";

    // Generate trend data
    const trends = {
        revenue: analyticsData.map(data => ({
            date: data.date,
            value: data.metrics.totalRevenue
        })),
        yield: analyticsData.map(data => ({
            date: data.date,
            value: data.metrics.totalYield
        })),
        expenses: analyticsData.map(data => ({
            date: data.date,
            value: data.metrics.totalExpenses
        }))
    };

    const summary = new AnalyticsSummary({
        userId,
        period,
        startDate,
        endDate,
        summary: {
            totalRevenue,
            totalExpenses,
            netProfit,
            averageGrowthRate,
            bestPerformingCrop,
            totalHarvests: crops.filter(crop => crop.status === 'harvested').length,
            soilHealthTrend: averageGrowthRate > 0 ? "improving" : "stable"
        },
        trends
    });

    await summary.save();
    return summary;
}
