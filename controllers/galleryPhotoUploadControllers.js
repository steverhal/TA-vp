const mysql = require("mysql2/promise");
const fs = require("fs").promises;
const sharp = require("sharp");

// Fotode üleslaadimise leht
const galleryPhotoUpload = (req, res) => {
    res.render("galleryPhotoUpload");
};

// Foto üleslaadimine
const galleryPhotoUploadPost = async (req, res) => {
    console.log(req.body);
    console.log(req.file);

    let conn;

    try {
        const fileName = "vp_" + Date.now() + ".jpg";

        await fs.rename(
            req.file.path,
            req.file.destination + fileName
        );

        const watermark = await sharp("./public/pic/vp_logo_small.png")
            .resize({width: 100})
            .png()
            .toBuffer();

        await sharp(req.file.destination + fileName)
            .resize(800, 600)
            .composite([{
                input: watermark,
                gravity: "southeast"
            }])
            .jpeg({quality: 90})
            .toFile(process.env.UPLOAD_RESIZED_PATH + fileName);

        await sharp(req.file.destination + fileName)
            .resize(100, 100)
            .jpeg({quality: 90})
            .toFile(process.env.UPLOAD_THUMBNAIL_PATH + fileName);

        let sqlReq = "INSERT INTO galleryphotos (filename, origname, alttext, privacy, userid) VALUES (?,?,?,?,?)";

        const userId = req.session.userId;

        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        });

        const [result] = await conn.execute(sqlReq, [
            fileName,
            req.file.originalname,
            req.body.altInput,
            req.body.privacyInput,
            userId
        ]);

        console.log("Salvestati kirje id: " + result.insertId);

        res.redirect("/myGallery");
    }
    catch (err) {
        console.log("Viga: " + err);
        res.render("galleryPhotoUpload");
    }
    finally {
        if (conn) {
            await conn.end();
        }
    }
};

module.exports = {
    galleryPhotoUpload,
    galleryPhotoUploadPost
};