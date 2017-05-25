var courseExtractor = require('./d2l-export-scraper');
var fs = require('fs');

var htmlChunks = courseExtractor('./Ben_Course_Export/');

htmlChunks = JSON.parse(htmlChunks);

//fs.writeFileSync('result.json', JSON.stringify(htmlChunks));

htmlChunks.filter(chunk => chunk.chunks.match(/quickLink/)).forEach(chunk =>
    var body = fs.readFileSync('./Ben_Course_Export/' + chunk.filename).replace(/quickLink/, '../../pages/' + chunk.filename)
    fs.writeFileSync(chunk.filename, body))
