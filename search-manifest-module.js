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

// Export this module
module.exports = main;

/**
 * The main driver of the program.  First, let's test out the xml2json
 * Module and see if it works.  Then, let's access an element from
 * the outputted JSON data.
 * 
 * @author Scott Nicholes
 */
function main(filePath) {
    var manifestObject = generateManifestObject(filePath);
    var formattedManifest = mapManifestData(manifestObject);

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

    var manifestObject = jxon.stringToJs(manifestXml);

    return manifestObject;
}

/**
 * Searches for the byui-production number and maps it to its corresponding title.
 * 
 * @param   {object} manifestObject The JSON Object we will map
 * @returns {object} A single object that contains the byui-production number mapped
 *                   to its title.
 * @author Scott Nicholes
 */
function mapManifestData(manifestObject) {
    // This array will hold all of the individual mapped objects for each XML item element.
    var parsedObjects = [];

    // Reduce each of the objects down to a 2 element object and then push it onto the above array.
    manifestObject.manifest.organizations.organization.item.forEach(function (currentItem) {
        var newObject = currentItem.item.reduce(function (rObj, element) {
            rObj[element['$d2l_2p0:resource_code'].match(/\d+$/)[0]] = element.title
            return rObj;
        }, {});

        parsedObjects.push(newObject);
    });

    // Reduce the array of objects we have down to a single object with numbers as keys
    // and titles as values
    var resultObject = parsedObjects.reduce(function (accum, element) {
        var keys = Object.keys(element);
        accum[keys[0]] = element[keys[0]];
        accum[keys[1]] = element[keys[1]];

        return accum;
    }, {});

    return resultObject

}
