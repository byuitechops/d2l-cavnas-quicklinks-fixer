var fs = require('fs')
var path = require('path')
var prompt = require('prompt')
var cheerio = require('cheerio')
var missingUrls = require('./missingUrls')
var folderName,$,courseID;


/* !!! START !!! */
if (require.main === module) {
	// called directly
	prompt.start();
	prompt.get({
		properties: {
			useNight: {
				name: 'Use Nightmare',
				type: 'boolean',
				default: 'false'
			},
			username: {
				ask: () => prompt.history('useNight').value,
				name: 'Username',
			},
			password: {
				ask: () => prompt.history('useNight').value,
				name: 'Password',
				hidden: true,
				replace: '*'
			},
			folderPath: {
				name: 'Export Folder Path',
				conform: fs.existsSync,
				default: './export'
			},
			resultFile: {
				name: 'Results Path',
				default: 'result.json'
			}
		}
	}, function (err,settings) {
		setCourseID(settings.folderPath)
		if (settings.useNight) {
			missingUrls.get(courseID, settings, urls => {
				// write the main to the file
				fs.writeFileSync(settings.resultFile,JSON.stringify(main(urls)))
			})
		} else {
			fs.writeFileSync(settings.resultFile,JSON.stringify(main(missingUrls.lazies(courseID))))
		}
	})
}
module.exports = function(folderPath,authFile,callback){
	setCourseID(folderPath)
	if(authFile){
		missingUrls.get(courseID, JSON.parse(fs.readFileSync('auth.json')),urls => {
			callback(main(urls))
		})
	} else {
		return main(missingUrls.lazies(courseID))
	}
}

function setCourseID(folderPath){
	folderName = folderPath
	var fileName = path.join(folderName, "imsmanifest.xml")
	$ = cheerio.load(fs.readFileSync(fileName, 'UTF-8'))
	courseID = $('manifest').attr('identifier').match(/\d+$/)[0]
}

function main(hardToGetURLs) {
	var resources = scrapeManifest() // returns array of objects
	resources.forEach(fileInfo => {
		if (fileInfo.type == "html") { // really simple if it is an html file
			// read the html page into a string
			var htmlPage = fs.readFileSync(path.join(folderName, fileInfo.fileName), 'UTF-8')
			fileInfo.htmlChunks.push({
				chunks: [htmlPage.trim()],
				html: htmlPage.trim(),
				// and grab the url
				href: "https://byui.brightspace.com/d2l/le/content/" + courseID + "/viewContent/" + fileInfo.id + "/View",
				type: "html"
			})
			fileInfo.href = "https://byui.brightspace.com/d2l/le/content/" + courseID + "/viewContent/" + fileInfo.id + "/View"
		} else { //if (fileInfo.fileName == "rubrics_d2l.xml"){
			// It is a bit trickier for xml files
			scrapeXML(fileInfo, hardToGetURLs)
		}
	})
	resources.forEach(file => file.htmlChunks.forEach(chunk => chunk.fileName = file.fileName))
	return resources.reduce((arr, file) => arr.concat(file.htmlChunks), []).filter(obj => obj.chunks.length)
}

function scrapeManifest() {
	var resources = []
	$('resource')
		.filter((i, el) => el.attribs.href.match(/^(?!http).*ml$/)) // I only want html and xml files
		.each((i, el) => {
			var attr = el.attribs // laziness
			var temp = attr.href.split(/\\|\/|\./).reverse() // It looks bad but hey it works
			resources.push({
				id: attr.identifier.match(/([A-Za-z0-9]+)$/)[0], // gets the number after the underscore
				fileName: attr.href,
				type: temp[0],
				title: attr.title ? attr.title : temp[1], // only quizzes have titles
				htmlChunks: []
			})
		})
	return resources
}

function scrapeXML(fileInfo, hardToGetURLs) {
	var $ = cheerio.load(fs.readFileSync(path.join(folderName, fileInfo.fileName), 'UTF-8'))

	function grabHTMLchunks(sel) {
		function isHTML(str) {
			return str.trim().match(/^<[\w\W]*>$/)
		}
		var htmlChunks = []
		$(sel)
			.each((i, el) => {
				var attrs = el.attribs
				Object.keys(attrs)
					.filter(key => isHTML(attrs[key]))
					.forEach(key => htmlChunks.push(attrs[key]))
			})
			.filter((i, el) => isHTML($(el).text()) && $(el).children() == 0)
			.each((i, el) => htmlChunks.push($(el).text()))
		return htmlChunks
	}

	function getSubsets() {
		return $(`${root[type]}`).children().get().map(elm => {
			if (elm.name != 'checklist') {
				return $(elm).attr('name')
			} else {
				return $($(elm).attr('id') + " name").text()
			}
		})
	}
	var root = {
		'rubric': 'rubrics',
		'dropbox': 'dropbox',
		'survey': 'questestinterop',
		'checklist': 'checklists',
		'quiz': 'questestinterop'
	}
	var type = fileInfo.fileName.replace(/_.*|\.xml/, '')

	// The Switch statment everyone has been looking forward to :P
	switch (type) {
		case 'syllabus':
		case 'questiondb':
		case 'competency':
		case 'grades':
			// There will only be one chunk object in this case
			fileInfo.htmlChunks.push({
				chunks: grabHTMLchunks('*'),
				href: hardToGetURLs[type]
			})
			//			console.log(fileInfo.htmlChunks)
			break;
		case 'rubrics':
		case 'dropbox':
		case 'survey':
		case 'checklist':
			// All the sections that have thier own different pages
			var sections = getSubsets()
			sections.forEach((name, i) => {
				// For each subsection push a different chunk object with it's own href
				fileInfo.htmlChunks.push({
					// Grab the html chunks for this subsection by passing it a fun selector
					chunks: grabHTMLchunks(`${root[type]} > :nth-child(${i+1}) *`),
					// Grab this subsection's href from the hardToGetURLs object
					href: hardToGetURLs[type] && hardToGetURLs[type][name]
				})
			})
			//			console.log(fileInfo.htmlChunks)
			break;
		case 'quiz':
			var id = $(`questestinterop assessment`).attr('ident').match(/\d+$/)[0]
			fileInfo.htmlChunks.push({
				chunks: grabHTMLchunks('*'),
				href: `https://byui.brightspace.com/d2l/lms/quizzing/admin/modify/quiz_newedit_properties.d2l?ou=${courseID}&qi=${id}`
			})
			//			console.log(fileInfo.htmlChunks)
			break;
		default:
			fileInfo.htmlChunks.push({
				chunks: grabHTMLchunks('*'),
				href: ''
			})
			break;
	}
	fileInfo.htmlChunks.forEach(chunk => {chunk.type = type; chunk.html = chunk.chunks.join('')})
}
