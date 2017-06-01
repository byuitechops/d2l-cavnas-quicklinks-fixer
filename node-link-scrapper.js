var fs = require('fs')
var mapLimit = require('async/mapLimit')
var request = require('request')
var auth = JSON.parse(fs.readFileSync('auth.json', 'utf-8'))
var nightmare = require('nightmare')({show: true})
var cookie;
var cookieJar;


module.exports = function(ou,callback){
	nightmare
		.goto('https://byui.brightspace.com/d2l/login?noredirect=true')
		.wait('#password')
		.insert('#userName', auth.username)
		.insert('#password', auth.password)
		.click('#formId div a')
		.wait(() => window.location.pathname == "/d2l/home")
		.wait(() => document.readyState === 'complete')
		.goto(`https://byui.brightspace.com/d2l/api/le/1.24/${ou}/content/toc`)
		.cookies.get()
		.then(value => {
			cookie = value
			return nightmare.evaluate(() => JSON.parse(document.querySelector('pre').innerText))
		})
		.then(data => {
			cookieJar = request.jar()
			cookieJar.setCookie(request.cookie('d2lSessionVal=' + cookie[1].value), 'https://byui.brightspace.com')
			cookieJar.setCookie(request.cookie('d2lSecureSessionVal=' + cookie[2].value), 'https://byui.brightspace.com')
			parseAPIdata(data, callback)
			return nightmare.end()
		})
}

function parseAPIdata(rawData, callback) {
	// Recursive function to get all the topics
	function parseModule(topModule) {
		return topModule.Modules.reduce((urls, module) => {
			// Add the urls in this modules's children
			if (module.Modules.length) {
				urls.push(...parseModule(module))
			}
			// Add the ones in this module
			return urls.concat(module.Topics
				.map(topic => topic.Url)
				.filter(url => url && url.match(/enforced.*\.html/))
				.map(url => 'https://byui.brightspace.com' + url))
		}, [])
	}
	getChildLinks(parseModule(rawData), callback)
}

function getChildLinks(links, callback, bucket, baseUrl) {
	if (!bucket) {
		bucket = {
			doneLinks: [],
			url: [],
			quickLinks: []
		}
	}
	var baseUrl = baseUrl || links[0].match(/https:\/\/byui\.brightspace\.com\/content\/enforced\/.*?\//)[0]
	console.log(links.length)
	mapLimit(links, 25, (link, done) => {
		// Gotta Catchum All!
		request({
			url: link,
			jar: cookieJar
		}, (error, response, body) => {
			done(null, {
				status: error || response.statusCode,
				data: body,
				from: link
			})
		})
	}, (err, responses) => {
		var froms = []
		// Sift through data, fun fun
		var childLinks = responses.filter(res => res.status == 200).reduce((linkCollection, response) => {
			// rip hrefs out of my html bodies
			var tags = response.data && response.data.match(/<a*.?href.*?=.*?".*?".*?>/g)
			var hrefs = tags && tags.map(str => str.match(/href.*?=.*?"(.*?)"/)[1])
			froms.push({
				page: response.from,
				last: linkCollection.length
			})
			// add them to the fat list
			return linkCollection.concat(hrefs)
				// take out all of my nulls
				.filter(link => link)
				// take out all the ones that we have already checked
				.filter(link => !(links.includes(link) || bucket.doneLinks.includes(baseUrl + link)))
				// take out all duplicates
				.filter((n, i, self) => self.indexOf(n) == i)
		}, [])
		var froms = froms.map((n, i, a) => {
			n.last = (a[i + 1] == undefined ? childLinks.length : a[i + 1].last) - n.last;
			return n
		}).reduce((a, n) => a.concat(new Array(n.last).fill(n.page)), [])
		childLinks = childLinks.map((n, i) => {
			return {
				href: n,
				from: froms[i]
			}
		})

		// only keep the contentLinks and other d2l html files
		var contentLinks = childLinks.map(n => n.href).filter(link => link.match('content.byui.edu'))
		var moreLinks = childLinks.map(n => n.href).filter(link => !link.match(/^\/|^http/) && link.match(/html$/)).map(link => baseUrl + link)
		var quickLinks = childLinks.filter(link => link.href.match(/quickLink/))
		//		console.log(childLinks)
		console.log(quickLinks)

		// add our links to the bucket
		bucket.url.push(...contentLinks)
		bucket.doneLinks.push(...moreLinks)
		bucket.quickLinks.push(...quickLinks)

		//	keep going if we have more to do
		if (moreLinks.length) {
			getChildLinks(moreLinks, callback, bucket, baseUrl)
		} else {
			callback(bucket)
		}
	});
}
