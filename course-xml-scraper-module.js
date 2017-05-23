var fs = require('fs');
var jxon = require('jxon');

/**
 * The main driver of the program.  First, let's test out the xml2json
 * Module and see if it works.  Then, let's access an element from
 * the outputted JSON data.
 * 
 * @author Scott Nicholes
 */
function main() {
    var readXml = fs.readFileSync('imsmanifest.xml', 'utf8');

    var xmlObject = jxon.stringToJs(readXml);

    // Find the first byui-prodou number
    xmlObject.manifest.organizations.organization.item.forEach(function (anItem) {
        console.log(anItem);
    })


    var arrayOfObjects = [];

    xmlObject.manifest.organizations.organization.item.forEach(function (currentItem) {
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


    console.log(resultObject);

    return resultObject
}

main();
module.exports = main;
