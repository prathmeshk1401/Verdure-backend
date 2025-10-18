// server.js (CommonJS)
const express = require("express");
const Parser = require("rss-parser");
const cors = require("cors");
require("dotenv").config();

const host = '0.0.0.0';
const port = process.env.PORT || 5000;

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const newsRoute = require("./routes/news");
const cropRoute = require("./routes/crop");
const storyRoute = require("./routes/story");
const dashboardRoute = require("./routes/dashboard");
const adminRoute = require("./routes/admin");
const forumRoute = require("./routes/forum");
const scheduleRoute = require("./routes/schedule");
const notificationRoute = require("./routes/notification");
const analyticsRoute = require("./routes/analytics");

const parser = new Parser();

// In serverless environments, avoid exiting the process on DB errors.
// Instead attempt to connect and let the function handler return errors.
connectDB().catch((err) => {
    console.error("Failed to connect to DB:", err && err.message ? err.message : err);
});

const app = express();

// Middleware
// Allow configuring allowed CORS origins via environment variable ALLOWED_ORIGINS (comma-separated).
const defaultAllowed = [
    "https://verdure-frontend.vercel.app",
    "https://admin-panel-tau-lac.vercel.app/",
    // allow localhost during previews/dev — remove in production if you prefer
    "http://localhost:3000",
];
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim())
    : defaultAllowed;

app.use(
    cors({
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/news", newsRoute);
app.use("/api/crop", cropRoute);
app.use("/api/success-stories", storyRoute);
app.use("/api/dashboard", dashboardRoute);
app.use("/api", adminRoute);
app.use("/api/forum", forumRoute);
app.use("/api/schedule", scheduleRoute);
app.use("/api/notifications", notificationRoute);
app.use("/api/analytics", analyticsRoute);

// Base test route
app.get("/", (req, res) => {
    res.json({ message: "Verdure backend is running ✅" });
});

app.listen(port, host, () => {
    console.log(`Server listening on http://${host}:${port}`);
});

module.exports = app;
