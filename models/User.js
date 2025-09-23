const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    lastLogin: { type: Date, default: null },
    dashboardData: {
        stats: { type: Object, default: {} },
        preferences: { type: Object, default: {} }
    }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);