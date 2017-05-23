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
var allObject = JSON.parse(fs.readFileSync('allQuickLinksBenCourse.json', 'utf8'));

var allKeys = Object.keys(allObject);
var manifestKeys = Object.keys(foundManifest);

// Search through the keys and output the ones that are not found in the manifestKeys
