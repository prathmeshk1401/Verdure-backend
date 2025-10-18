// server.js
const express = require("express");
const Parser = require("rss-parser");
const cors = require("cors");
require("dotenv").config();

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
const app = express();

// -------------------------
// Server Config
// -------------------------
const host = "0.0.0.0";
const port = process.env.PORT || 5000;

// -------------------------
// Database Connection
// -------------------------
connectDB().catch((err) => {
    console.error("Failed to connect to DB:", err?.message || err);
});

// -------------------------
// CORS Configuration
// -------------------------
const allowedOrigins = [
    "https://verdure-innovating-agriculture.vercel.app",
    "https://verdure-admin.vercel.app",
    "https://verdure-frontend.vercel.app",
    "http://localhost:3000",
];

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                console.log("Blocked by CORS:", origin);
                callback(new Error("Not allowed by CORS"));
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true,
    })
);

// Handle preflight requests
app.options("*", cors());

// -------------------------
// Middleware
// -------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------------
// Routes
// -------------------------
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

// -------------------------
// Base Route
// -------------------------
app.get("/", (req, res) => {
    res.json({ message: "Verdure backend is running ✅" });
});

// -------------------------
// Start Server
// -------------------------
app.listen(port, host, () => {
    console.log(`✅ Server listening on http://${host}:${port}`);
});

module.exports = app;
