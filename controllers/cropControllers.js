const Crop = require("../models/crop");

exports.getCrops = async (req, res) => {
    try {
        const crops = await Crop.find();
        res.json(crops);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch crops" });
    }
};
