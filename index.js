const express = require('express');
const fs = require('fs').promises;
const bodyparser = require('body-parser');
const path = require('path');
const dateET = require('./src/dateTimeET');

const textRef = 'public/txt/vanasonad.txt';
const regTextRef = 'public/txt/visits.txt';

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyparser.urlencoded({extended: false}));

// Avaleht
app.get('/', (req, res) => {
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
