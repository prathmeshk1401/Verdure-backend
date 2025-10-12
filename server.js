// index.js

import express, { json, urlencoded } from "express";
import Parser from "rss-parser";
import cors from "cors";
import { config } from "dotenv";
config();

import connectDB from "./config/db.js"; // note: .js extension
import authRoutes from "./routes/authRoutes.js";
import newsRoute from "./routes/news.js";
import cropRoute from "./routes/crop.js";
import storyRoute from "./routes/story.js";
import dashboardRoute from "./routes/dashboard.js";
import adminRoute from "./routes/admin.js";
import forumRoute from "./routes/forum.js";
import scheduleRoute from "./routes/schedule.js";
import notificationRoute from "./routes/notification.js";
import analyticsRoute from "./routes/analytics.js";

const parser = new Parser();

// Connect to MongoDB with error handling
connectDB().catch((err) => {
    console.error("Failed to connect to DB:", err.message);
    process.exit(1);
});

const app = express();

// Middleware
app.use(cors({
    origin: [
        "https://verdure-frontend.vercel.app",
        "https://verdure-admin.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(json());
app.use(urlencoded({ extended: true }));

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

// Export app for Vercel serverless
export default app;
