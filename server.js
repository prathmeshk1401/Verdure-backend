const express = require("express");
const Parser = require("rss-parser");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

// Routes
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
// Allowed CORS Origins
// -------------------------
const allowedOrigins = [
    "http://localhost:3000",
    "https://verdure-innovating-agriculture.vercel.app",
    "https://verdure-admin.vercel.app",
    "https://verdure-frontend.vercel.app",
    "https://verdure-innovating-agriculture-hwmi-a15uvagtd.vercel.app",
    "https://verdure-innovating-agri-git-19e502-prathmeshs-projects-97d276a8.vercel.app"
];

// -------------------------
// CORS Configuration
// -------------------------
app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                console.log("❌ Blocked by CORS:", origin);
                callback(new Error("Not allowed by CORS"));
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
    })
);

app.use((req, res, next) => {
    if (req.method === "OPTIONS") {
        res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
        res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
        return res.sendStatus(200);
    }
    next();
});


// -------------------------
// Middleware
// -------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------------
// Database Connection
// -------------------------
connectDB().catch(err => {
    console.error("Failed to connect to DB:", err);
});

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
const host = "0.0.0.0";
const port = process.env.PORT || 5000;

app.listen(port, host, () => {
    console.log(`🚀 Server running at http://${host}:${port}`);
});

module.exports = app;
