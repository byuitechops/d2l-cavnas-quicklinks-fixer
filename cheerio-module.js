/*****************************************************
 * Search Manifest Module.js
 * This module searches the imsmanifest.xml file found
 * in an exported D2L course and returns an object
 * that has byui-production numbers as keys and their
 * corresponding titles as values.
 * 
 * INPUT: Either the file directory path, or the
 * actual .xml filepath of the imsmanifest.xml file.
 * 
 * OUTPUT FORMAT:
 * {byui-production number: <title>}
 * 
 * Written By: Scott Nicholes
 ****************************************************/
var fs = require('fs');
var jxon = require('jxon');
var cheerio = require('cheerio');
var $;

// Export this module
module.exports = main;
//main();

/**
 * The main driver of the program.  First, let's test out the xml2json
 * Module and see if it works.  Then, let's access an element from
 * the outputted JSON data.
 * 
 * @author Scott Nicholes
 */
function main(filePath) {
    /*// NON-CHEERIO WAY:
var manifestObject = generateManifestObject(filePath);
var formattedManifest = mapManifestData(manifestObject);*/

    // CHEERIO WAY:
    filePath = 'imsmanifest.xml';
    generateManifestObject(filePath);
    formattedManifest = mapManifestData();

    return formattedManifest;
}

/**
 * Generates an object out of the given imsmanifest.xml file.
 * 
 * @param   {String} filePath The path to the imsmanifest.xml file
 * @returns {object} The converted XML file into a JSON Object.
 * @author Scott Nicholes
 */
function generateManifestObject(filePath) {
    var manifestXml;

    // Error check and read the file if they give us the .xml, 
    // ELSE: Do the same for the folder path.
    if (filePath.includes('.xml')) {
        if (!fs.existsSync(filePath)) {
            throw 'File does not exist in that path'
        }
        manifestXml = fs.readFileSync(filePath, 'utf8');
    } else {
        if (!fs.existsSync(filePath + '\imsmanifest.xml')) {
            throw 'File does not exist in that folder';
        }
        manifestXml = fs.readFileSync(filePath + '\imsmanifest.xml', 'utf8');
    }

    // Load in the XML to cheerio
    $ = cheerio.load(manifestXml);
}

/**
 * Searches for the byui-production number and maps it to its corresponding title.
 * 
 * @param   {object} manifestObject The JSON Object we will map
 * @returns {object} A single object that contains the byui-production number mapped
 *                   to its title.
 * @author Scott Nicholes
 *         
 * NON CHEERIO WAY:
 * function mapManifestData(manifestObject)        
 */
function mapManifestData() {
    var titles = $('title').get();

    var titleNames = [];
    var titleCodes = [];
    titles.forEach(function (title) {
        if (!title.children[0].data.includes('quickLink')) {
            titleNames.push(title.children[0].data);
            titleCodes.push(title.parent.attribs['d2l_2p0:resource_code']);
        }
    });

    var newObject = titleCodes.reduce(function (rObj, element, index) {
        rObj[element.match(/\d+$/)[0]] = titleNames[index];
        return rObj;
    }, {});

    //console.log(newObject);

    return newObject;
}
