// crops.js
const express = require("express");
const router = express.Router();
const { getCrops } = require("../controllers/cropControllers");

router.get("/", getCrops);
module.exports = router;
