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
        res.render("eestifilmiinimesed", {personList: sqlRes});
    }
    catch (err) {
        console.log("Viga andmebaasist lugemisel: " + err);
        res.render("eestifilmiinimesed", {personList: []});
    }
    finally {
        if(conn) {
            await conn.end();
        }
    }
});

app.get("/eestifilm/inimesed_add", (req, res)=>{
    res.render("eestifilmiinimesed_add", {
        notice: "Ootan sisestust!",
        firstName: null,
        lastName: null,
        born: null,
        deceased: null
    });
});

app.post("/eestifilm/inimesed_add", async (req, res)=>{
    console.log(req.body);

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const bornDate = new Date(req.body.bornInput + 'T00:00:00');
    let deceasedDate = null;

    if(req.body.deceasedInput != '') {
        deceasedDate = new Date(req.body.deceasedInput + 'T00:00:00');
    }

    //kontrollime andmete olemasolu ja sünnikuupäeva
    if(!req.body.firstNameInput || !req.body.lastNameInput ||
        !req.body.bornInput || isNaN(bornDate.getTime()) || bornDate > now) {
        console.log("Andmed pole korrektsed");
        return res.render("eestifilmiinimesed_add", {
            notice: "Eesnimi, perekonnanimi või sünnikuupäev on vigane!",
            firstName: req.body.firstNameInput || null,
            lastName: req.body.lastNameInput || null,
            born: req.body.bornInput || null,
            deceased: req.body.deceasedInput || null
        });
    }

    //kontrollime surmakuupäeva
    if(deceasedDate !== null &&
        (isNaN(deceasedDate.getTime()) || deceasedDate > now || deceasedDate < bornDate)) {
        console.log("Surmakuupäev pole korrektne");
        return res.render("eestifilmiinimesed_add", {
            notice: "Surmakuupäev on vigane!",
            firstName: req.body.firstNameInput || null,
            lastName: req.body.lastNameInput || null,
            born: req.body.bornInput || null,
            deceased: req.body.deceasedInput || null
        });
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
        await conn.execute(sqlReq, [
            req.body.firstNameInput,
            req.body.lastNameInput,
            req.body.bornInput,
            req.body.deceasedInput || null
        ]);
        res.render("eestifilmiinimesed_add", {
            notice: "Andmed salvestati! Ootan uut sisestust!",
            firstName: null,
            lastName: null,
            born: null,
            deceased: null
        });
    }
    catch (err) {
        console.log("Viga andmebaasiga suhtlemisel: " + err);
        res.render("eestifilmiinimesed_add", {
            notice: "Tekkis viga! Andmeid ei salvestatud!",
            firstName: req.body.firstNameInput || null,
            lastName: req.body.lastNameInput || null,
            born: req.body.bornInput || null,
            deceased: req.body.deceasedInput || null
        });
    }
    finally {
        if(conn) {
            await conn.end();
        }
    }
});

// Filmide lisamine
app.get("/eestifilm/filmid_add", (req, res)=>{
    res.render("eestifilmid_add", {
        notice: "Ootan sisestust!",
        title: null,
        releaseYear: null,
        duration: null,
        description: null
    });
});

app.post("/eestifilm/filmid_add", async (req, res)=>{
    const title = req.body.titleInput;
    const releaseYear = req.body.releaseYearInput;
    const duration = req.body.durationInput;
    const description = req.body.descriptionInput;

    const year = Number(releaseYear);
    const minutes = Number(duration);

    if(!title || !title.trim() || !releaseYear ||
        !Number.isInteger(year) || year <= 0 ||
        !duration || !Number.isInteger(minutes) || minutes <= 0) {
        return res.render("eestifilmid_add", {
            notice: "Kontrolli filmi pealkirja, linastumisaastat ja kestust!",
            title: title || null,
            releaseYear: releaseYear || null,
            duration: duration || null,
            description: description || null
        });
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
        let sqlReq = "INSERT INTO movie (title, release_year, duration_minutes, description) VALUES (?,?,?,?)";
        await conn.execute(sqlReq, [
            title.trim(),
            year,
            minutes,
            description || null
        ]);
        res.render("eestifilmid_add", {
            notice: "Film salvestati! Ootan uut sisestust!",
            title: null,
            releaseYear: null,
            duration: null,
            description: null
        });
    }
    catch (err) {
        console.log("Viga andmebaasiga suhtlemisel: " + err);
        res.render("eestifilmid_add", {
            notice: "Tekkis viga! Filmi ei salvestatud!",
            title: title || null,
            releaseYear: releaseYear || null,
            duration: duration || null,
            description: description || null
        });
    }
    finally {
        if(conn) {
            await conn.end();
        }
    }
});

// Žanrite lisamine
app.get("/eestifilm/zanrid_add", (req, res)=>{
    res.render("eestifilmizanrid_add", {
        notice: "Ootan sisestust!",
        genreName: null,
        description: null
    });
});

app.post("/eestifilm/zanrid_add", async (req, res)=>{
    const genreName = req.body.genreNameInput;
    const description = req.body.descriptionInput;

    if(!genreName || !genreName.trim()) {
        return res.render("eestifilmizanrid_add", {
            notice: "Sisesta žanri nimi!",
            genreName: genreName || null,
            description: description || null
        });
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
        let sqlReq = "INSERT INTO genre (name, description) VALUES (?,?)";
        await conn.execute(sqlReq, [
            genreName.trim(),
            description || null
        ]);
        res.render("eestifilmizanrid_add", {
            notice: "Žanr salvestati! Ootan uut sisestust!",
            genreName: null,
            description: null
        });
    }
    catch (err) {
        console.log("Viga andmebaasiga suhtlemisel: " + err);
        res.render("eestifilmizanrid_add", {
            notice: "Tekkis viga! Žanrit ei salvestatud!",
            genreName: genreName || null,
            description: description || null
        });
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