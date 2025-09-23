const mongoose = require("mongoose");

const analyticsDataSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    metrics: {
        totalCrops: { type: Number, default: 0 },
        activeCrops: { type: Number, default: 0 },
        totalYield: { type: Number, default: 0 }, // in kg
        totalRevenue: { type: Number, default: 0 },
        totalExpenses: { type: Number, default: 0 },
        netProfit: { type: Number, default: 0 },
        soilHealth: { type: Number, default: 0 }, // percentage
        growthRate: { type: Number, default: 0 }, // percentage
        harvestEfficiency: { type: Number, default: 0 } // percentage
    },
    cropBreakdown: [{
        cropId: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop' },
        cropName: { type: String },
        yield: { type: Number },
        revenue: { type: Number },
        expenses: { type: Number }
    }],
    weatherData: {
        temperature: { type: Number },
        humidity: { type: Number },
        rainfall: { type: Number },
        conditions: { type: String }
    },
    activities: [{
        type: { type: String }, // crop, harvest, expense, etc.
        description: { type: String },
        value: { type: Number },
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

// Index for efficient queries
analyticsDataSchema.index({ userId: 1, date: -1 });
analyticsDataSchema.index({ 'metrics.totalRevenue': -1 });

const analyticsSummarySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    period: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
        required: true
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    summary: {
        totalRevenue: { type: Number, default: 0 },
        totalExpenses: { type: Number, default: 0 },
        netProfit: { type: Number, default: 0 },
        averageGrowthRate: { type: Number, default: 0 },
        bestPerformingCrop: { type: String },
        totalHarvests: { type: Number, default: 0 },
        soilHealthTrend: { type: String } // improving, declining, stable
    },
    trends: {
        revenue: [{ date: Date, value: Number }],
        yield: [{ date: Date, value: Number }],
        expenses: [{ date: Date, value: Number }]
    }
}, { timestamps: true });

module.exports = {
    AnalyticsData: mongoose.model("AnalyticsData", analyticsDataSchema),
    AnalyticsSummary: mongoose.model("AnalyticsSummary", analyticsSummarySchema)
};
