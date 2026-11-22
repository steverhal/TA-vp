
const express = require('express');
const fs = require('fs').promises;
const bodyparser = require('body-parser');
const mysql = require('mysql2/promise');
require('dotenv').config();
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);

const checkLogin = require("./src/checkLogin");
const dateET = require('./src/dateTimeET');

const textRef = 'public/txt/vanasonad.txt';
const regTextRef = 'public/txt/visits.txt';

const app = express();

// Sessioon
const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

app.use(session({
    secret: process.env.SES_SECRET,
    store: sessionStore,
    saveUninitialized: false,
    resave: false,
    cookie: {
        maxAge: 1000 * 60 * 60
    }
}));

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyparser.urlencoded({extended: true}));

// Sisseloginud kasutaja nimi kõigile lehtedele
app.use((req, res, next) => {
    res.locals.userName = req.session.userName || null;
    next();
});

// Avaleht
app.get('/', async (req, res) => {
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

// Sisseloginud kasutaja avaleht
app.get('/home', checkLogin.isLogin, (req, res) => {
    res.render("home");
});

// Väljalogimine
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
            return res.redirect("/home");
        }
        res.clearCookie("connect.sid");
        res.redirect("/");
    });
});

// Vanasõnad
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

app.get('/miksTLU', (req, res) => {
    res.render('miksTLU');
});

app.get('/tlu', (req, res) => {
    res.render('miksTLU');
});

app.get('/minust', (req, res) => {
    res.render('minust');
});

// Külastuse registreerimine
const regvisitRouter = require("./routes/regvisitRoutes");
app.use("/regvisit", regvisitRouter);

// Eesti film
const eestifilmRouter = require("./routes/eestifilmRoutes");
app.use("/eestifilm", eestifilmRouter);

// Fotode üleslaadimine
const galleryPhotoUploadRouter = require("./routes/galleryPhotoUploadRoutes");
app.use("/galleryPhotoUpload", galleryPhotoUploadRouter);

// Fotogalerii
const galleryRouter = require("./routes/galleryRoutes");
app.use("/gallery", galleryRouter);

// Minu galerii
const myGalleryRouter = require("./routes/myGalleryRoutes");
app.use("/myGallery", myGalleryRouter);

// Registreerimine
const signupRouter = require('./routes/signupRoutes');
app.use('/signup', signupRouter);

// Sisselogimine
const signinRouter = require('./routes/signinRoutes');
app.use('/signin', signinRouter);

// Tundmatu marsruut
app.use((req, res) => {
    res.status(404).send('404 - Sellist lehte ei leitud.');
});

app.listen(5110, () => {
    console.log('Veebiserver töötab pordil 5110');
});
