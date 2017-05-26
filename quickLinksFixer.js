var courseExtractor = require('./d2l-export-scraper');
var searcher = require('./cheerio-module');
var fs = require('fs');

var htmlChunks = courseExtractor('./Ben_Course_Export/');

//htmlChunks = JSON.parse(htmlChunks);

var searchedManifest = searcher('./');

var rootFilenames = fs.readdirSync('./Ben_Course_Export/');
var courseFilenames = fs.readdirSync('./Ben_Course_Export/Course Files');

// Make a directory to put all of our files
if (!fs.existsSync("tempCourseFiles/")) {
  fs.mkdirSync("tempCourseFiles/");
}

var keys = Object.keys(searchedManifest);

var foundFileNames = [];
rootFilenames.forEach(function (filename) {
  keys.forEach(function (key) {
    if (filename.includes(searchedManifest[key])) {
      foundFileNames.push(filename);
    }
  });
});

courseFilenames.forEach(function (filename) {
  keys.forEach(function (key) {
    if (filename.includes(searchedManifest[key])) {
      foundFileNames.push(filename);
    }
  });
});

console.log('(found: ' + foundFileNames.length + ' / total: ' + keys.length + ')');

// Now, read each file and fix each link
console.log('htmlChunksLength: ' + htmlChunks.length);

var tempFilenameArray = [];

var filteredArray = htmlChunks.filter(function (chunk) {
  return chunk.chunks.some(function (dataItem) {
    return dataItem.includes("quickLink");
  })
  //return chunk.chunks.match(/quickLink/);
});

for (var i = 1; i <= filteredArray.length; i++) {
  var newMeep = 'meep' + i.toString();
  tempFilenameArray.push(newMeep);
}

console.log('filteredLength: ' + filteredArray.length);
console.log('tempFilenameContents: ' + tempFilenameArray[0]);

//console.log(filteredArray);


filteredArray.forEach(function (chunk, index) {
  var body;
  //console.log(chunk.fileName);

  body = fs.readFileSync('./Ben_Course_Export/' + chunk.fileName, 'utf8');

  //var matchArray;
  var newBody;
  if (chunk.fileName !== 'syllabus_d2l.xml') {
    //console.log("I'm in COACH")
    matchArray = body.match(/"\/d2l.*?byui.*?(\d+).*?"/i);
    newBody = body.replace(/"\/d2l.*?byui.*?(\d+).*?"/i, '../../pages/' + tempFilenameArray[index] + '-' + matchArray[1]) // filename from my result JSON)
  } else {
    matchArray = body.match(/\/d2l.*?byui.*?(\d+)/);
    newBody = body.replace(/\/d2l.*?byui.*?(\d+)/i, '../../pages/' + tempFilenameArray[index] + '-' + matchArray[1]) // filename from my result JSON)
  }
  //console.log(matchArray[1]);
  //console.log(newBody.includes("meep"));

  if (chunk.fileName.includes("Course Files")) {
      var adjustedFileName = chunk.fileName.replace("Course Files\\", '');
      //console.log(adjustedFileName);
      fs.writeFileSync("tempCourseFiles/" + adjustedFileName, newBody);
  } else {
      fs.writeFileSync("tempCourseFiles/" + chunk.fileName, newBody);
  }
});
