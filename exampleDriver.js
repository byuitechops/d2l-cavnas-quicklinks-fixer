/********************************************
 * Example Driver.js
 * This is a program that tests out the 
 * search-manifest-module.
 * 
 * Written By: Scott Nicholes
 *******************************************/
var manifestSearcher = require('./search-manifest-module.js');

var foundManifest = manifestSearcher('../');

console.log(foundManifest);
