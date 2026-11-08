const mysql = require("mysql2/promise");

//@desc fotogalerii leht
//@route GET /gallery
//@access public

const gallery = async (req, res) => {
    let conn;
    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        });

        const sqlReq = "SELECT filename, alttext FROM galleryphotos WHERE privacy >= ? AND deleted IS NULL ORDER BY id DESC";
        const [photos] = await conn.execute(sqlReq, [2]);

        res.render("gallery", {photos: photos});
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

module.exports = {
    gallery
};