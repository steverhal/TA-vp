const express = require("express");
const checkLogin = require("../src/checkLogin");

const router = express.Router();
router.use(checkLogin.isLogin);

const {
    galleryHome,
    galleryPage
} = require("../controllers/galleryControllers");

router.get("/", galleryHome);
router.get("/:page", galleryPage);

module.exports = router;