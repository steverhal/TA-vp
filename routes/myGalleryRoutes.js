const express = require("express");
const checkLogin = require("../src/checkLogin");

const router = express.Router();

router.use(checkLogin.isLogin);

const {myGallery} = require("../controllers/galleryControllers");

router.route("/").get(myGallery);

module.exports = router;