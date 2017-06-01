var zip = require('cross-zip')
var fs = require('fs')
var cheerio = require('cheerio')
//var scraper = require('d2l-export-scraper')


function scrapeIMS(){
	var $ = cheerio.load(fs.readFileSync('export\\imsmanifest.xml'))
	return $('title').get().reduce((obj, elm) => {
		if(!$(elm).text().match(/quickLink/))
			obj[$(elm).parent().attr('d2l_2p0:resource_code').match(/\d+$/)[0]] = $(elm).text();
		return obj
	},{})
}

function main(ou) {
	// Download the course from d2l (later)
	// Unzip the folder
	zip.unzipSync('export.zip','export')
	// Make our tweaks to the course
	// Rezip the folder
	zip.zipSync('export','export.zip')
	// Create the new course in Canvas
	// Upload the zip folder to Canvas
	// Make more tweaks with the Canvas API
	// combine the quiz instructions
}


//zip.zipSync('export','export.zip')
console.log(scrapeIMS())