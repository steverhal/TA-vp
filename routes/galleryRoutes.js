const express = require("express");
const checkLogin = require("../src/checkLogin");

const router = express.Router();
router.use(checkLogin.isLogin);

const {
    gallery
} = require("../controllers/galleryControllers");

router.route("/").get(gallery);

module.exports = router;