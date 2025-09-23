const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/scheduleController");
const { verifyToken } = require("../middleware/auth");

// All routes require authentication
router.use(verifyToken);

// GET /api/schedule - Get all schedules
router.get("/", scheduleController.getSchedules);

// GET /api/schedule/upcoming - Get upcoming schedules
router.get("/upcoming", scheduleController.getUpcomingSchedules);

// GET /api/schedule/stats - Get schedule statistics
router.get("/stats", scheduleController.getScheduleStats);

// POST /api/schedule - Create a new schedule
router.post("/", scheduleController.createSchedule);

// PUT /api/schedule/:id - Update a schedule
router.put("/:id", scheduleController.updateSchedule);

// POST /api/schedule/:id/complete - Mark schedule as completed
router.post("/:id/complete", scheduleController.completeSchedule);

// DELETE /api/schedule/:id - Delete a schedule
router.delete("/:id", scheduleController.deleteSchedule);

module.exports = router;
