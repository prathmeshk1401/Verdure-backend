const mongoose = require("mongoose");

const storySchema = new mongoose.Schema({
    name: String,
    location: String,
    crop: String,
    revenue: Number,
    testimonial: String
});

module.exports = mongoose.model("Story", storySchema);
