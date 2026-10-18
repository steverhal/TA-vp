const mysql = require("mysql2/promise")
//@desc home page for Estonian Film section
//@route GET /eestifilm
//@access public

/// app.get("/eestifilm", (req,res)=>{
const eestifilm = (req, res) => {
    res.render("eestifilm");
}; 

//@desc home page for list of people involved in Estonian Film industry
//@route GET /eestifilm/inimesed
//@access public

//app.get("/eestifilm/inimesed", async (req,res)=>{
const inimesed = async (req,res) => {
//    console.log("Andmebaasiserver on: " + process.env.DB_HOST);
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
};

//@desc home page for adding people involved in Estonian Film industry
//@route GET /eestifilm/inimesed_add
//@access public

//app.get("/eestifilm/inimesed_add", (req, res)=>{
const inimesedAdd = (req,res) => {
    res.render("eestifilmiinimesed_add", {
        notice: "Ootan sisestust!",
        firstName: null,
        lastName: null,
        born: null,
        deceased: null
    });
};

//@desc home page for adding people involved in Estonian Film industry
//@route POST /eestifilm/inimesed_add
//@access public

//app.post("/eestifilm/inimesed_add", async (req, res)=>{
const inimesedAddPost = async (req, res) => { 
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
};

//@desc home page for Estonian Films
//@route GET /eestifilm/filmid
//@access public

const filmid = async (req, res) => {
    let conn;
    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
        });

        const [movieList] = await conn.execute(
            "SELECT * FROM movie ORDER BY title"
        );

        res.render("eestifilmid", {movieList: movieList});
    }
    catch (err) {
        console.log("Viga filmide lugemisel: " + err);
        res.render("eestifilmid", {movieList: []});
    }
    finally {
        if(conn) {
            await conn.end();
        }
    }
};

//@desc home page for adding Estonian Films
//@route GET /eestifilm/filmid_add
//@access public

//app.get("/eestifilm/filmid_add", (req, res)=>{
const filmidAdd = (req,res) => {
    res.render("eestifilmid_add", {
        notice: "Ootan sisestust!",
        title: null,
        releaseYear: null,
        duration: null,
        description: null
    });
};

//@desc home page for adding Estonian Films
//@route POST /eestifilm/filmid_add
//@access public

//app.post("/eestifilm/filmid_add", async (req, res)=>{
const filmidAddPost = async (req, res) => {  
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
};

//@desc home page for Film genres
//@route GET /eestifilm/zanrid_add
//@access public


const zanrid = async (req, res) => {
    let conn;
    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
        });

        const [genreList] = await conn.execute(
            "SELECT * FROM genre ORDER BY name"
        );

        res.render("eestifilmizanrid", {genreList: genreList});
    }
    catch (err) {
        console.log("Viga žanrite lugemisel: " + err);
        res.render("eestifilmizanrid", {genreList: []});
    }
    finally {
        if(conn) {
            await conn.end();
        }
    }
};


//@desc home page for adding Film genres
//@route GET /eestifilm/zanrid_add
//@access public

const zanridAdd = (req,res) => {
//app.get("/eestifilm/zanrid_add", (req, res)=>{
    res.render("eestifilmizanrid_add", {
        notice: "Ootan sisestust!",
        genreName: null,
        description: null
    });
};

//@desc home page for adding Film genres
//@route POST /eestifilm/zanrid_add
//@access public

//app.post("/eestifilm/zanrid_add", async (req, res)=>{
const zanridAddPost = async (req, res) => {  
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
};

const seosedAdd = async (req, res) => {
    let conn;
    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
        });

        const [personList] = await conn.execute(
            "SELECT id, first_name, last_name FROM person ORDER BY last_name"
        );
        const [movieList] = await conn.execute(
            "SELECT id, title FROM movie ORDER BY title"
        );
        const [professionList] = await conn.execute(
            "SELECT id, title FROM profession ORDER BY title"
        );

        res.render("eestifilmseosed_add", {
            personList,
            movieList,
            professionList,
            notice: req.query.notice || "Ootan sisestust!",
            personId: null,
            movieId: null,
            professionId: null,
            characterName: null
        });
    } catch (err) {
        console.log("Viga seoste lisamise lehe avamisel: " + err);
        res.status(500).send("Andmebaasist andmete lugemine ebaõnnestus.");
    } finally {
        if (conn) await conn.end();
    }
};

const seosedAddPost = async (req, res) => {
    let conn;
    const personId = req.body.personId;
    const movieId = req.body.movieId;
    const professionId = req.body.professionId;
    const characterName = req.body.characterName?.trim() || null;

    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
        });

        const [profession] = await conn.execute(
            "SELECT title FROM profession WHERE id = ?",
            [professionId]
        );

        if (!personId || !movieId || !professionId || profession.length === 0) {
            return res.status(400).send("Vali inimene, film ja amet.");
        }

        if (profession[0].title === "näitleja" && !characterName) {
            return res.status(400).send("Näitleja puhul sisesta ka tegelaskuju nimi.");
        }

        const [existing] = await conn.execute(
            `SELECT id FROM person_in_movie
             WHERE person_id = ? AND movie_id = ? AND profession_id = ?
             AND character_name <=> ?`,
            [personId, movieId, professionId,
                profession[0].title === "näitleja" ? characterName : null]
        );

        if (existing.length > 0) {
            return res.redirect("/eestifilm/seosed_add?notice=duplicate");
        }

        await conn.execute(
            `INSERT INTO person_in_movie
             (person_id, movie_id, profession_id, character_name)
             VALUES (?, ?, ?, ?)`,
            [personId, movieId, professionId,
                profession[0].title === "näitleja" ? characterName : null]
        );

        res.redirect("/eestifilm/seosed_add?notice=saved");
    } catch (err) {
        console.log("Viga seose salvestamisel: " + err);
        res.status(500).send("Seose salvestamine ebaõnnestus.");
    } finally {
        if (conn) await conn.end();
    }
};

const seosed = async (req, res) => {
    let conn;
    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
        });

        const [seosedList] = await conn.execute(
            `SELECT person.first_name, person.last_name, movie.title AS movie_title,
                    profession.title AS profession_title, person_in_movie.character_name
             FROM person_in_movie
             JOIN person ON person_in_movie.person_id = person.id
             JOIN movie ON person_in_movie.movie_id = movie.id
             JOIN profession ON person_in_movie.profession_id = profession.id
             ORDER BY movie.title, person.last_name`
        );

        res.render("eestifilmseosed", {seosedList});
    } catch (err) {
        console.log("Viga seoste lugemisel: " + err);
        res.render("eestifilmseosed", {seosedList: []});
    } finally {
        if (conn) await conn.end();
    }
};

module.exports = {
	eestifilm,
	inimesed,
	inimesedAdd,
	inimesedAddPost,
	filmid,
	filmidAdd,
	filmidAddPost,
	zanrid,
	zanridAdd,
	zanridAddPost,
    seosedAdd,
    seosedAddPost,
    seosed
}	