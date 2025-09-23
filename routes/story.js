// stories.js
const express = require("express");
const router = express.Router();
const { getStories } = require("../controllers/storiesControllers");

router.get("/", getStories);
module.exports = router;
