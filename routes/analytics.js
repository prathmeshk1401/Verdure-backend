const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const { verifyToken } = require("../middleware/auth");

// All routes require authentication
router.use(verifyToken);

// GET /api/analytics/data - Get analytics data for date range
router.get("/data", analyticsController.getAnalyticsData);

// GET /api/analytics/summary - Get analytics summary for period
router.get("/summary", analyticsController.getAnalyticsSummary);

// GET /api/analytics/dashboard - Get dashboard analytics
router.get("/dashboard", analyticsController.getDashboardAnalytics);

router.get("/crop-performance/:cropId", analyticsController.getCropPerformance);

// POST /api/analytics/record - Record analytics data
router.post("/record", analyticsController.recordAnalyticsData);

module.exports = router;
