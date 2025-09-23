const mongoose = require("mongoose");

const cropSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    exportPrice: Number,
    expenses: Number,
    totalIncome: Number,
    profitMargin: Number,
    profitIncome: Number,
    link: String,
    status: { type: String, enum: ['planted', 'growing', 'ready', 'harvested'], default: 'planted' },
    plantedDate: { type: Date, default: Date.now },
    expectedHarvestDate: Date,
    area: Number, // in acres
    location: String
}, { timestamps: true });

module.exports = mongoose.model("Crop", cropSchema);
