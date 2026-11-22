const mysql = require("mysql2/promise");

// Tavaline fotogalerii
const gallery = async (req, res) => {
    let conn;

    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        });

        const sqlReq = "SELECT id, filename, alttext, privacy FROM galleryphotos WHERE privacy >= ? AND deleted IS NULL ORDER BY id DESC";
        const [photos] = await conn.execute(sqlReq, [2]);

        let galleryData = [];

        for (let i = 0; i < photos.length; i++) {
            let altText = photos[i].alttext || "Galerii foto";
            galleryData.push({
                src: photos[i].filename,
                alt: altText,
                id: photos[i].id
            });
        }

        res.render("gallery", {
            photos: photos,
            galleryData: galleryData
        });
    }
    catch (err) {
        console.log("Viga galerii laadimisel: " + err);
        res.status(500).send("Viga galerii laadimisel");
    }
    finally {
        if (conn) {
            await conn.end();
        }
    }
};

// Minu galerii
const myGallery = async (req, res) => {
    let conn;

    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        });

        const sqlReq = "SELECT id, filename, alttext, privacy FROM galleryphotos WHERE userid = ? AND deleted IS NULL ORDER BY id DESC";
        const [photos] = await conn.execute(sqlReq, [req.session.userId]);

        res.render("myGallery", {photos: photos});
    }
    catch (err) {
        console.log("Viga minu galerii laadimisel: " + err);
        res.status(500).send("Viga minu galerii laadimisel");
    }
    finally {
        if (conn) {
            await conn.end();
        }
    }
};

module.exports = {
    gallery,
    myGallery
};