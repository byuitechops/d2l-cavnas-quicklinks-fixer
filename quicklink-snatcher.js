var Nightmare = require('night-map')(require('nightmare'))
var fs = require('fs')
var auth = JSON.parse(fs.readFileSync('auth.json'))
var cheerio = require('cheerio')
var path = require('path')
var scraper = require('./d2l-export-scraper')

function nightmareIt(ou, ids, callback) {
	var nightmare = Nightmare({
		show: true
	})
	nightmare
		.goto('https://byui.brightspace.com/d2l/login?noredirect=true')
		.wait('#password')
		.insert('#userName', auth.username)
		.insert('#password', auth.password)
		.click('#formId div a')
		.wait(() => window.location.pathname == "/d2l/home")
		.wait(() => document.readyState === 'complete')
		.map(id => {
			return nightmare
				.evaluate((ou, id) => $(`<a href="/d2l/common/dialogs/quickLink/quickLink.d2l?ou=${ou}&amp;type=content&amp;rcode=byui_produ-${id}" id="click-me" target="_self">Click Me</a>`).appendTo('body'), ou, id) // Inject the link on whatever page we are on
				.click('#click-me') // click the link
				.wait('.d2l-page-title') // save whatever title comes up on the next page
				.evaluate(() => $('.d2l-page-title').text())
		}, ids)
		.then((arr) => {
			callback(ids.reduce((obj, id, i) => {
				obj[id] = arr[i];
				return obj
			}, {}))
			return nightmare.end()
		})
}

function scrapeIMS(folder) {
	var $ = cheerio.load(fs.readFileSync(path.join(folder, 'imsmanifest.xml')))
	return $('title').get().reduce((obj, elm) => {
		if (!$(elm).text().match(/quickLink/))
			obj[$(elm).parent().attr('d2l_2p0:resource_code').match(/\d+$/)[0]] = $(elm).text();
		return obj
	}, {})
}

function scrapeDiss(folder) {
	return fs.readdirSync(folder).filter(str => str.match(/discussion/)).map(fileName => {
		var $ = cheerio.load(fs.readFileSync(path.join(folder, fileName)))
		return $('title').get().reduce((obj, elm) => {
			obj[$(elm).parent().parent().attr('resource_code').match(/\d+$/)[0]] = $(elm).text();
			return obj
		}, {})
	}).reduce((a, b) => Object.assign(a, b), {})
}

function getOu(folder) {
	var $ = cheerio.load(fs.readFileSync(path.join(folder, 'imsmanifest.xml')))
	return $('manifest').attr('identifier').match(/\d+$/)[0]
}

function format(items){
	for(var id in items){
		items[id] = items[id].toLowerCase().replace(/\b\.\b/g,' dot ').replace(/[^\w\s]|_/g,' ').replace(/\s+/g,'-')
	}
	return items
}

function getAllLinks(folder,callback) {
	//	console.log(scraper('export')[1].html.match(/quickLink.*?byui.*?(\d+)/g))
	var unknowns = scraper(folder)
		.reduce((arr, chunk) => {
			arr.push(chunk.html.match(/quickLink.*?byui.*?(\d+)/g));
			return arr
		}, [])
		.filter(n => n) // take out the ones that don't have any quicklinks
		.reduce((a, b) => a.concat(b), []) // flatten the 2d array
		.map(str => str.match(/\d+$/)[0]) // just use the number
		.filter((n, i, a) => a.indexOf(n) == i) // take out duplicates

	var knowns = Object.assign(scrapeDiss(folder), scrapeIMS(folder))
	//	console.log(unknowns.length,Object.keys(knowns).length)
	unknowns = unknowns.filter(n => !Object.keys(knowns).includes(n))
	if(callback){
		nightmareIt(getOu(folder), unknowns, nightmared => {
			knowns = Object.assign(knowns, nightmared)
			callback(format(knowns))
		})
	} else {
		return format(knowns)
	}
}

module.exports = getAllLinks

// Instructions:
//  
//  Without the nightmare stuff, and just sync:
//		console.log(getAllLinks('./export'))
//
//  With nightmare stuff (you can get more ids, but nightmare is sketchy):
//		getAllLinks('./export',data => console.log(data))