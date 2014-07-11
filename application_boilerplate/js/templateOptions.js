/*global define */
/*jslint sloppy:true */
/*
 | Copyright 2014 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */
define({
    // When true, the template will query arcgis.com for the webmap item.
    "queryForWebmap": true,
    // When true, the template will query arcgis.com for the group's information.
    "queryForGroupInfo": false,
    // When true, the template will query arcgis.com for the items contained within the group
    "queryForGroupItems": false,
    //When true the template will query arcgis.com for default settings for helper services, units etc. If you
    //want to use custom settings for units or any of the helper services set queryForOrg to false then enter
    //default values for any items you need using the helper services and units properties.
    "queryForOrg": true,
    //If you need localization set the localize value to true to get the localized strings
    //from the javascript/nls/resource files.
    //Note that we've included a placeholder nls folder and a resource file with one error string
    //to show how to setup the strings file.
    "queryForLocale": true,
    // When true, this will query and mixin a common config file from the path specified in the index.html dojo packages
    "queryForCommonConfig": false,
    // These are the options specified for querying items within the group. Modify these to get more items. You can also call the public template.queryGroupItems() method with these options as a parameter.
    "groupParams": {
        "sortField": "modified",
        "sortOrder": "desc",
        "num": 9,
        "start": 0
    },
    //This option demonstrates how to handle additional custom url parameters. For example
    //if you want users to be able to specify lat/lon coordinates that define the map's center or
    //specify an alternate basemap via a url parameter.
    "urlItems": [
        "theme" // example param. ?theme=<my theme>
    ]
});