const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { verifyToken, checkAdmin } = require("../middleware/auth");

router.get("/", verifyToken, dashboardController.getDashboard);
router.post("/update", verifyToken, dashboardController.updateDashboard);
router.get("/admin", verifyToken, checkAdmin, dashboardController.getAdminStats);

module.exports = router;