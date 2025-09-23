const express = require("express");
const cors = require("cors");

const app = express();

// Must be **before routes**
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// your routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);
