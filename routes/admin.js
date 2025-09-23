const express = require("express");
const router = express.Router();
const { verifyToken, checkAdmin } = require("../middleware/auth");
const { getUsers, updateUserRole, getUserSummary, getUserDashboardSummary } = require("../controllers/adminController");

// Admin-protected routes
router.get("/users", verifyToken, checkAdmin, getUsers);
router.patch("/users/:id", verifyToken, checkAdmin, updateUserRole);
router.get("/users/summary", verifyToken, checkAdmin, getUserSummary);
router.get("/users/:id/dashboard", verifyToken, checkAdmin, getUserDashboardSummary);

module.exports = router;

