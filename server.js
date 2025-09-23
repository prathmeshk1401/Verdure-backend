const express = require("express");
const Parser = require("rss-parser");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const parser = new Parser();

// Connect to MongoDB with error handling
connectDB().catch((err) => {
    console.error("Failed to connect to DB:", err.message);
    process.exit(1);
});


const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);

// Basic test route
app.get("/", (req, res) => res.send("Backend is running"));

const newsRoute = require("./routes/news");
app.use("/api/news", newsRoute);

app.use("/api/crop", require("./routes/crop"));
app.use("/api/success-stories", require("./routes/story"));
// Mount dashboard routes for user and admin dashboards
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api", require("./routes/admin"));

// Mount new API routes
app.use("/api/forum", require("./routes/forum"));
app.use("/api/schedule", require("./routes/schedule"));
app.use("/api/notifications", require("./routes/notification"));
app.use("/api/analytics", require("./routes/analytics"));

// Start server safely
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
