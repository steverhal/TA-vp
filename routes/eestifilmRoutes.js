const express = require("express");
const router = express.Router();

//kontrollerid
const{
	eestifilm,
	inimesed,
	inimesedAdd,
	inimesedAddPost,
	filmid,
	filmidAdd,
	filmidAddPost,
	zanrid,
	zanridAdd,
	zanridAddPost} = require("../controllers/eestifilmControllers");
	
router.route("/").get(eestifilm);

router.route("/inimesed").get(inimesed);

router.route("/inimesed_add").get(inimesedAdd);

router.route("/inimesed_add").post(inimesedAddPost);

router.route("/filmid").get(filmid);

router.route("/filmid_add").get(filmidAdd);

router.route("/filmid_add").post(filmidAddPost);

router.route("/zanrid").get(zanrid);

router.route("/zanrid_add").get(zanridAdd);

router.route("/zanrid_add").post(zanridAddPost);

module.exports = router;