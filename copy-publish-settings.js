var prompt = require('prompt');
var fs = require('fs');
var request = require('request');

// main
function main() {
    var orgUnitId;
    var courseId;

    getDataFromSettings(function (error, data) {
        if (error) {
            console.log('There was an error witht the prompting process.');
            console.log('Ending program...');
            return;
        }

        orgUnitId = data.orgUnitId;
        courseId = data.course_id;

        getModuleData(orgUnitId);
    });
}

// getDataFromSettings
function getDataFromSettings(callback) {
    // Load the settings file
    var settings = fs.readFileSync('copyPublishRunSettings.json', 'utf8');

    // Parse the settings file
    settings = JSON.parse(settings);

    // Run prompt with the Settings file
    prompt.start();
    prompt.get(settings, function (error, response) {
        if (error) {
            callback(error);
        }

        callback(null, response);
    });

    // Save the responses as defaults

    // Send the reponses back to main
}

// getModuleData
function getModuleData(orgUnitId) {
    // Make a GET Request URL with the orgUnitId received
    var url = `https://byui.brightspace.com/d2l/api/le/1.2/${orgUnitId}/content/root/`;

    // Perform the GET Request
    request.get(url, function (error, response, body) {
        console.log(body);
    });

    // Get the data we need

    // Call getItemData with each moduleId
}

// getItemData
function getItemData(moduleId) {

}

// applyChangesToCanvas

main();
