var fs = require('fs');
var jxon = require('jxon');


/**
 * The main driver of the program.  First, let's test out the xml2json
 * Module and see if it works.  Then, let's access an element from
 * the outputted JSON data.
 * 
 * @author Scott Nicholes
 *         'imsmanifest.xml'
 */
function main(filePath) {
    var manifestObject = generateManifestObject(filePath);
    var formattedManifest = formatManifestObject(manifestObject);

    return formattedManifest;
}

function generateManifestObject(filePath) {
    var receivedXml;

    // Error check and read the file if they give us the .xml, ELSE: Do the same for the folder path.
    if (filePath.includes('.xml')) {
        if (!fs.existsSync(filePath)) {
            throw 'File does not exist in that path'
        }
        receivedXml = fs.readFileSync(filePath, 'utf8');
    } else {
        if (!fs.existsSync(filePath + '\imsmanifest.xml')) {
            throw 'File does not exist in that fplder';
        }
        receivedXml = fs.readFileSync(filePath + '\imsmanifest.xml', 'utf8');
    }

    var manifestObject = jxon.stringToJs(receivedXml);

    return manifestObject;
}

function formatManifestObject(manifestObject) {
    var arrayOfObjects = [];

    manifestObject.manifest.organizations.organization.item.forEach(function (currentItem) {
        var newObject = currentItem.item.reduce(function (rObj, element) {
            rObj[element['$d2l_2p0:resource_code'].match(/\d+$/)[0]] = element.title
            return rObj;
        }, {});

        arrayOfObjects.push(newObject);
    });

    var resultObject = arrayOfObjects.reduce(function (accum, element) {
        var keys = Object.keys(element);
        accum[keys[0]] = element[keys[0]];
        accum[keys[1]] = element[keys[1]];

        return accum;
    }, {});


    //console.log(resultObject);

    return resultObject

}

//main();
module.exports = main;
