const express = require('express');
const fs = require('fs').promises;
//moodul URL-i lahtiharutamiseks, et saaks POST osad ka kätte
const bodyparser = require('body-parser');
//moodul andmebaasiga suhtlemiseks, promises osaga async programmeerimise jaoks
const mysql = require('mysql2/promise');
//moodul .env faili lugemiseks, keskkonnamuutujate parsimiseks
require('dotenv').config();
const dateET = require('./src/dateTimeET');

const textRef = 'public/txt/vanasonad.txt';
const regTextRef = 'public/txt/visits.txt';

//käivitan express.js funktsiooni ja annan nimeks "app"
const app = express();
//määrame veebilehtedele mallide renderdamise mootori
app.set('view engine', 'ejs');
//määran ühe päris kataloogi virtuaalses serveris kättesaadavaks
app.use(express.static('public'));
app.use(bodyparser.urlencoded({extended: false}));

// marsruudid
app.get('/', (req, res) => {
	//res.send("Express.js läks kaima ja serveerib meile veebi.");
    const dayNow = dateET.day();
    const dateNow = dateET.fullDate(0);
    const timeNow = dateET.fullTime();

    res.render('index', {
        dayNow: dayNow,
        dateNow: dateNow,
        timeNow: timeNow
    });
});

// Vanasõna
app.get('/vanasonad', async (req, res) => {
    try {
        const data = await fs.readFile(textRef, 'utf8');
        const folkWisdom = data.split(';');
        const wisdom = folkWisdom[Math.floor(Math.random() * folkWisdom.length)];

        res.render('vanasona', {wisdom: wisdom});
    } catch (err) {
        console.log(err);
        res.render('vanasona', {
            wisdom: 'Ei leidnud ühtegi vanasõna!'
        });
    }
});

// Õpetaja repo vana marsruut jääb samuti tööle
app.get('/vanasona', async (req, res) => {
    try {
        const data = await fs.readFile(textRef, 'utf8');
        const folkWisdom = data.split(';');
        const wisdom = folkWisdom[Math.floor(Math.random() * folkWisdom.length)];

        res.render('vanasona', {wisdom: wisdom});
    } catch (err) {
        console.log(err);
        res.render('vanasona', {
            wisdom: 'Ei leidnud ühtegi vanasõna!'
        });
    }
});

// Natuke Tallinna Ülikoolist
app.get('/miksTLU', (req, res) => {
    res.render('miksTLU');
});

// Õpetaja repo vana marsruut
app.get('/tlu', (req, res) => {
    res.render('miksTLU');
});

// Minust
app.get('/minust', (req, res) => {
    res.render('minust');
});

// Külastuse registreerimine
app.get('/regvisit', (req, res) => {
    res.render('regvisit');
});

app.post('/regvisit', async (req, res) => {
    try {
        const dateNow = dateET.fullDate(0);
        const timeNow = dateET.fullTime();

        await fs.appendFile(
            regTextRef,
            req.body.nameInput + ',' + dateNow + ',' + timeNow + ';'
        );

        res.render('regvisit');
    } catch (err) {
        console.log(err);
        res.render('regvisit');
    }
});

// Eesti film
app.get("/eestifilm", (req,res)=>{
	res.render("eestifilm");
});

app.get("/eestifilm/inimesed", async (req,res)=>{
	console.log("Andmebaasiserver on: " + process.env.DB_HOST);
	let conn;
	try {
		// loon andmebaasiühenduse
		conn = await mysql.createConnection({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASS,
			database: process.env.DB_NAME,
        });
		const sqlReq = "SELECT * FROM person ORDER by last_name";
		const [sqlRes] = await conn.execute(sqlReq);
		console.log(sqlRes);
		res.render("eestifilminimesed", {personList: sqlRes});
	}	
	catch (err) {
		console.log("Viga andmebaasist lugemisel: " + err);
		res.render("eestifilminimesed", {personList: []});
	}	
	finally {
		if(conn) {
		await conn.end();
		}
	}	
});

app.get("/eestifilm/inimesed_add", (req, res)=>{
	res.render("eestifilmiinimesed_add", {notice: "Ootan sisestust!"});
});	

app.post("/eestifilm/inimesed_add", async (req, res)=>{
	console.log(req.body);
	//kontrollime andmete olemasolu
	if(!req.body.firstNameInput || !req.body.lastNameInput || !req.body.bornInput || req.body.bornInput >= new Date()){
		console.log("Andmed pole korrektsed");
		return res.render("eestifilmiinimesed_add", {notice: "Andmed on puudulikud!"});
	}	
	let conn;
	try {
		// loon andmebaasiühenduse
		conn = await mysql.createConnection({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASS,
			database: process.env.DB_NAME,
        });
		let sqlReq = "INSERT INTO person (first_name, last_name, born, deceased) VALUES (?,?,?,?)";
		let deceasedDate= null;
		if(req.body.deceasedInput !='') {
			deceasedDate = req.body.deceasedInput;
		}	
		await conn.execute(sqlReq, [
			req.body.firstNameInput,
			req.body.lastNameInput,
			req.body.bornInput,
			deceasedDate
		]);
		res.render("eestifilmiinimesed_add", {notice: "Andmed salvestati! Ootan uut sisestust!"});
	}
	catch (err) {
		console.log("Viga andmebaasiga suhtlemisel: " + err);
		res.render("eestifilmiinimesed_add", {notice: "Tekkis viga! Andmeid ei salvestatud!"});
	}	
	finally {
		if(conn) {
			await conn.end();
		}
	}
});

// Viimane külastus
app.get('/viimane', async (req, res) => {
    try {
        const data = await fs.readFile(regTextRef, 'utf8');
        const visits = data.split(';');

        const lastVisit = visits[visits.length - 2];
        const visitData = lastVisit.split(',');

        res.render('viimane', {
            name: visitData[0],
            date: visitData[1],
            time: visitData[2]
        });
    } catch (err) {
        console.log(err);
        res.render('viimane', {
            name: '',
            date: '',
            time: ''
        });
    }
});

// Tundmatu marsruut
app.use((req, res) => {
    res.status(404).send('404 - Sellist lehte ei leitud.');
});

app.listen(5110, () => {
    console.log('Veebiserver töötab pordil 5110');
});
