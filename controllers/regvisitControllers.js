const fs = require('fs').promises;
const dateET = require('../src/dateTimeET');
const regTextRef = 'public/txt/visits.txt';
//@desc home page for registering visits
//@route GET /regvisit
//@access public

// Külastuse registreerimine
//app.get('/regvisit', async (req, res) => {
const regvisit = async (req, res) => {
	try {
		const data = await fs.readFile(regTextRef, "utf8");
		const visits = data.split(";");
		
		const lastVisit = visits[visits.length - 2];
		const visitData = lastVisit.split(",");
		
		res.render("regvisit", {
			name: visitData[0],
			date: visitData[1],
			time: visitData[2]
		});
	} catch (err) {
		console.log(err);
		res.render("regvisit", {
			name: "",
			date: "",
			time: ""
		});
	}
};

//@desc home page for registering visits
//@route POST /regvisit
//@access public

//app.post('/regvisit', async (req, res) => {
const regvisitPost = async (req, res) => {  
    try {
        const dateNow = dateET.fullDate(0);
        const timeNow = dateET.fullTime();

        await fs.appendFile(
            regTextRef,
            req.body.nameInput + ',' + dateNow + ',' + timeNow + ';'
        );

        res.redirect('/regvisit');
		
    } catch (err) {
        console.log(err);
        res.status(500).send("Külastuse registreerimine ebaõnnestus.");
    }
};

module.exports = {
	regvisit,
	regvisitPost
}	