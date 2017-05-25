/********************************************
 * Example Driver.js
 * This is a program that tests out the 
 * search-manifest-module.
 * 
 * Written By: Scott Nicholes
 *******************************************/
var fs = require('fs');
var manifestSearcher = require('./search-manifest-module.js');

var foundManifest = manifestSearcher('./');
//var allObject = JSON.parse(fs.readFileSync('allQuickLinksBenCourse.json', 'utf8'));

fs.writeFileSync('foundManifest.json', JSON.stringify(foundManifest));
