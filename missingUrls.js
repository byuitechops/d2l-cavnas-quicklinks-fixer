var Nightmare = require('nightmare')
var nightmare,courseID,done,lazies;

function factory(name, url, next) {
	return function (bucket) {
		return nightmare
			.goto(url)
			.wait((url) => window.location.href == url, url)
			.evaluate(() =>
				$('th a.vui-link').get()
				.map((node) => {
					return {
						name: $(node).text(),
						link: $(node).attr('href'),
						origin: window.location.origin,
						full: window.location.href
					}
				})
			)
			.then(nodes => {
				bucket[name] = nodes
				return next(bucket)
			})
	}
}


function moveOn(bucket){
	formatBucket(bucket)
	return nightmare.end()
}

function formatBucket(bucket) {
	nightmare.end()
	for (var key in bucket) {
		bucket[key].forEach(obj => {
			obj.full = obj.link[0]=='/'?obj.origin + obj.link:obj.full.replace(/(\/)(?!.*\1.*).*/,"/"+obj.link)
		})
		bucket[key] = bucket[key].reduce((obj, elm) => {
			obj[elm.name] = elm.full;
			return obj
		}, {})
	}
	done(Object.assign(bucket,lazies))
}


module.exports = {
	get:function(ID,logInData,callback){
		courseID = ID
		done = callback
		nightmare = Nightmare({show:true})
		lazies = {
			'competency':'https://byui.brightspace.com/d2l/lms/competencies/competency_list.d2l?ou='+courseID,
			'grades':'https://byui.brightspace.com/d2l/lms/grades/admin/manage/gradeslist.d2l?ou='+courseID,
			'syllabus':'https://byui.brightspace.com/d2l/le/content/'+courseID+'/Home',
			'questiondb':'https://byui.brightspace.com/d2l/lms/qc/main_frame.d2l?ou='+courseID,
			'discussion':'https://byui.brightspace.com/d2l/le/'+courseID+'/discussions/List'
		}
		var go = [['rubrics', 'https://byui.brightspace.com/d2l/lp/rubrics/list.d2l?ou=' + courseID],
				  ['dropbox', 'https://byui.brightspace.com/d2l/lms/dropbox/admin/folders_manage.d2l?ou=' + courseID],
				  ['survey', 'https://byui.brightspace.com/d2l/lms/survey/admin/surveys_manage.d2l?ou=' + courseID],
				  ['checklist', 'https://byui.brightspace.com/d2l/lms/checklist/checklists.d2l?ou=' + courseID]]
			// Good luck trying to understand these next lines
			.reverse().reduce((last, args) => {
				args.push(last)
				return factory.apply(null, args)
			}, moveOn)
		
		nightmare
			.goto('https://byui.brightspace.com/d2l/login?noredirect=true')
			.wait('#password')
			.insert('#userName', logInData.username)
			.insert('#password', logInData.password)
			.click('#formId div a')
			.wait(() => window.location.pathname == "/d2l/home")
			.then( () => go({}))
			.catch(console.error)
	},
	lazies:function(courseID){
		return {
			'competency':'https://byui.brightspace.com/d2l/lms/competencies/competency_list.d2l?ou='+courseID,
			'grades':'https://byui.brightspace.com/d2l/lms/grades/admin/manage/gradeslist.d2l?ou='+courseID,
			'syllabus':'https://byui.brightspace.com/d2l/le/content/'+courseID+'/Home',
			'questiondb':'https://byui.brightspace.com/d2l/lms/qc/main_frame.d2l?ou='+courseID,
			'discussion':'https://byui.brightspace.com/d2l/le/'+courseID+'/discussions/List'
		}
	}
}
