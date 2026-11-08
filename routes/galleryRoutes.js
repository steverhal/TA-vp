const express = require("express");

const router = express.Router();

const {
    gallery
} = require("../controllers/galleryControllers");

router.route("/").get(gallery);

module.exports = router;