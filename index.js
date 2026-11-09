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
app.use(bodyparser.urlencoded({extended: true}));//kui vormidest ainult tekst, siis "false"

// marsruudid
app.get('/', async (req, res) => {
    //res.send("Express.js läks kaima ja serveerib meile veebi.");
    const dayNow = dateET.day();
    const dateNow = dateET.fullDate(0);
    const timeNow = dateET.fullTime();

    let conn;
    let latestPhoto = null;

    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        });

        const sqlReq = "SELECT filename, alttext FROM galleryphotos WHERE id=(SELECT MAX(id) FROM galleryphotos WHERE privacy=? AND deleted IS NULL)";
        const [photos] = await conn.execute(sqlReq, [3]);

        latestPhoto = photos[0] || null;
    }
    catch (err) {
        console.log("Viga avalehe foto laadimisel: " + err);
    }
    finally {
        if (conn) {
            await conn.end();
        }
    }

    res.render('index', {
        dayNow: dayNow,
        dateNow: dateNow,
        timeNow: timeNow,
        latestPhoto: latestPhoto
    });
});

//sisseloginud kasutajate avaleht
app.get('/home', (req, res) => {
	res.render("home");
});

//väljalogimine
app.get('/logout', (req, res) => {
	res.redirect("/");
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

// Minustss
app.get('/minust', (req, res) => {
    res.render('minust');
});

//Külastuse registreerimise marsruudid
const regvisitRouter = require("./routes/regvisitRoutes");
app.use("/regvisit", regvisitRouter);

//Eesti filmi marsruudid
const eestifilmRouter = require("./routes/eestifilmRoutes");
app.use("/eestifilm", eestifilmRouter);

//galeriipiltide üleslaadimine
const galleryPhotoUploadRouter = require("./routes/galleryPhotoUploadRoutes");
app.use("/galleryPhotoUpload", galleryPhotoUploadRouter);

//fotogalerii
const galleryRouter = require("./routes/galleryRoutes");
app.use("/gallery", galleryRouter);

//kasutajakonto loomise marsruut
const signupRouter = require('./routes/signupRoutes');
app.use('/signup', signupRouter);

//sisselogimise marsruut
const signinRouter = require('./routes/signinRoutes');
app.use('/signin', signinRouter);

// Tundmatu marsruut
app.use((req, res) => {
    res.status(404).send('404 - Sellist lehte ei leitud.');
});

app.listen(5110, () => {
    console.log('Veebiserver töötab pordil 5110');
});