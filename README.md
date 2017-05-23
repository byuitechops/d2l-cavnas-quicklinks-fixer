# course-conversion-tool
Convert D2l course into a canvas course

## Course XML Scraper Module
A Module that reads the XML manifest file that is found in a D2L export ZIP file and returns the byui-production number associated with its title attribute.
<br>
<br>
Format returned:
<br>
````````````````````````````````````````
{
    byui-productionNumber: <title>
}
````````````````````````````````````````