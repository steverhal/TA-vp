const mysql = require("mysql2/promise");

//@desc Photogallery opening page
//@route GET /gallery
//@access private

const galleryHome = (req, res) => {
	res.redirect("/gallery/1");
}

//@desc Photogallery
//@route GET /gallery
//@access private

const galleryPage = async (req, res) => {
	let page = parseInt(req.params.page);
    let conn;
	let skip = 5;
	const limit = 5;
	const privacy = 2;
	//kontrollime, et lk number poleks liiga väike või, et ta üldse on number
	if(page < 1 || isNaN(page)) {
		page = 1;
	}
    try {
		conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        });
		//uurime, palju galeriisse sobivaid fotosid üldse on
		let sqlReq = "SELECT count(id) AS photos  FROM galleryphotos WHERE privacy >= ? AND deleted IS NULL";
		const [countResult] = await conn.execute(sqlReq, [privacy]);
		const photoCount = countResult[0].photos;
		//kui leheküljenumber on liiga suur
		if((page-1) * limit >= photoCount) {
			//valin kõige viimase võimaliku lehekülje
			page = Math.max(1, Math.ceil(photoCount / limit));
		}
		skip = (page - 1) * limit;
		
			//teeme navigatsioonilingid
			let galleryLinks
			//tagasi
		if(page === 1){
			galleryLinks = "Eelmine leht &nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;";
		} else {
			galleryLinks = `<a href="/gallery/${page - 1}">Eelmine leht</a>&nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;`;
		}
		//edasi
		if(page * limit >= photoCount) {
			galleryLinks += "Järgmine leht";
		} else {
			galleryLinks += `<a href="/gallery/${page + 1}">Järgmine leht</a>`;
		}
			
        sqlReq = "SELECT id, filename, alttext, privacy FROM galleryphotos WHERE privacy >= ? AND deleted IS NULL LIMIT ?,?";
        const [photos] = await conn.execute(sqlReq, [privacy, skip, limit]);
        let galleryData = [];
        for (let i = 0; i < photos.length; i++) {
            let altText = photos[i].alttext || "Galerii foto";
            galleryData.push({src: photos[i].filename, alt: altText, id: photos[i].id});
        }
        res.render("gallery", {photos: photos, galleryData: galleryData, imagehref: process.env.GALLERY_THUMBNAIL, links: galleryLinks});
    }
    catch (err) {
        console.log("Viga galerii laadimisel: " + err);
		galleryLinks = "Eelmine leht &nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp; Järgmine leht";
        res.render("gallery", {photos: photos, galleryData: galleryData, imagehref: process.env.GALLERY_THUMBNAIL, links: galleryLinks});
    }
    finally {
        if (conn) {
            await conn.end();
        }
    }
};

//@desc My photogallery
//@route GET /mygallery
//@access private
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
    galleryHome,
	galleryPage,
    myGallery
};