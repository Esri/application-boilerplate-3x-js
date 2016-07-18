# Application Boilerplate

A starter Application for building ArcGIS Online configurable applications with the ArcGIS API for JavaScript version 4.

We hope it helps :)

## Purpose

The purpose of the `Boilerplate.js` is to handle fetching and managing ArcGIS Online information used in configurable applications such as:

- Portal information
- User information
- Item data (webscene, webmap, group information, group items)
- Configured application information
- URL parameters

The boilerplate will handle fetching this information, store it, and perform setup when necessary.

## Features

This bare-bones app includes all the code you need to build an ArcGIS Online configurable application. It will save you time when:

*	Making an ArcGIS Online compatible application.
*	Using your ArcGIS Online webscene to power the application.
*	Localizing your application in different languages.
*	Capturing URL parameters and using them in your application.
*	Using settings from your ArcGIS Online portal or configured application.
*	Enabling your application to sign-in to ArcGIS Online using [OAuth 2.0](http://oauth.net/2/).

[View it live](http://esri.github.io/application-boilerplate-js/)

[![App](https://raw.github.com/Esri/application-boilerplate-js/4master/images/thumb.png)](http://esri.github.io/application-boilerplate-js/)

# Settings & Configuration

## Configuration Options

This is the configuration options for the application. `config.json`

|property|description|type|default|
|---|---|---|---|
|appid|Application ID for querying application configuration|String|""|
|group|Group ID for querying a portal group|String|""|
|webscene|Webscene ID for querying a webscene|String|"19faa71a3bf6468cae35b4fce9393a7d"|
|webmap|Webmap ID for querying a webmap|String|""|
|title|Title of the application|String|""|
|portalUrl|URL to the ArcGIS Portal|String|"https://www.arcgis.com"|
|oauthappid|oAuth authentication ID|String|""|
|proxyUrl|Enter the url to the proxy if needed by the application. See the [Using the proxy page](http://developers.arcgis.com/en/javascript/jshelp/ags_proxy.html) help topic for details.|String|""|
|units|Application measurement units|String|""|
|helperServices|Object containing URLs to various helper services|Object|See below|

### Sample

```js
{
  "appid": "",
  "group": "",
  "webscene": "19faa71a3bf6468cae35b4fce9393a7d",
  "webmap": "",
  "title": "",
  "portalUrl": "https://www.arcgis.com",
  "oauthappid": "",
  "proxyUrl": "",
  "units": "",
  "helperServices": {
    "geometry": {
      "url": null
    },
    "printTask": {
      "url": null
    },
    "elevationSync": {
      "url": null
    },
    "geocode": [{
      "url": null
    }]
  }
}
```

## Boilerplate Settings

These are the configuration options for the Boilerplate. `settings.json`

|property|description|type|default|
|---|---|---|---|
|webscene|Webscene related settings|Object|See below|
|webscene.fetch|When true the application will query for a webscene|Boolean|true|
|webscene.useLocal|Use a local hosted web scene instead of a web scene on ArcGIS or portal|Boolean|false|
|webscene.localFile|Webscene file to use for the local web scene|String|"boilerplate/demoWebscene.json"|
|webmap|Webmap related settings|Object|See below|
|webmap.fetch|When true the application will query for a webmap|Boolean|false|
|webmap.useLocal|Use a local hosted web map instead of a web map on ArcGIS or portal|Boolean|false|
|webmap.localFile|Webmap file to use for the local web map|String|"boilerplate/demoWebmap.json"|
|group|Group related settings|Object|See below|
|group.fetchInfo|When true the application will query for a group's information|Boolean|false|
|group.fetchItems|When true the application will query for a group's items|Boolean|false|
|group.itemParams|Defines query paramaters for fetching group items|Object|See below|
|portal|Portal related settings|Object|See below|
|portal.fetch|When true the application will query arcgis.com for default settings for helper services, units etc. If you want to use custom settings for units or any of the helper services set this to false then enter default values for any items you need using the helper services and units properties.|Boolean|true|
|urlItems|Defines which URL parameters should be captured and stored into the config for use within the application|String[]|See below|
|webTierSecurity|Support sending credentials with AJAX requests to specific domains. This will allow editing of feature services secured with web-tier authentication|Boolean|false|
|esriEnvironment|Most users will not need to modify this value. For Esri hosting environments only. Will automatically create a `portalUrl` and `proxyUrl` for the application. Only set this is to true if the app is going to be stored on Esri's hosting servers. If you are using your own custom hosted portal, set the `portalUrl` in `config.json` instead of setting this to true.|   Boolean|false|

### Sample
```js
{
  "webscene": {
    "fetch": true,
    "useLocal": false,
    "localFile": "boilerplate/demoWebscene.json"
  },
  "webmap": {
    "fetch": false,
    "useLocal": false,
    "localFile": "boilerplate/demoWebmap.json"
  },
  "group": {
    "fetchInfo": false,
    "fetchItems": false,
    "itemParams": {
      "query": "group:\"{groupid}\" AND -type:\"Code Attachment\"",
      "sortField": "modified",
      "sortOrder": "desc",
      "num": 9,
      "start": 0
    }
  },
  "portal": {
    "fetch": true
  },
  "urlItems": [
    "appid",
    "group",
    "oauthappid",
    "webmap",
    "webscene",
    "embed",
    "center",
    "extent",
    "level",
    "marker",
    "components",
    "viewpoint"
  ],
  "webTierSecurity": false,
  "esriEnvironment": false
}
```

# Folders and Files

The template consists of the following folders and files:

- **/config/:** A folder for your application's configuration files.
    - **config.json:** Define the default configuration information for the application. You can use this file to specify things like a default web map id, a proxy url, default services, default color theme and other application-specific settings.
- **/css/:** Contains the CSS files for the application.
    - **main.css** This file contains the map styles that set the margin, padding and initial height (100%).
- **/images/**: Contains images used by the application and this readme.
- **/js/**: Contains JavaScript files
    - **dojoConfig.js:** Dojo configuration file for defining module packages.
    - **/application/:** Application specific logic. This is where you would put your application's classes and logic.
        - **main.js:** Creates a scene based on configuration info. You will write all your main application logic in here.
        - **/examples/:** Other `main.js` example js files. Demonstrates code using a group or webmap.
        - **/nls/:** The nls folder contains a file called `resources.js` that contains the language strings used by the application. If the application needs to be supported by [multiple locales](https://developers.arcgis.com/en/javascript/jshelp/localization.html) you can create a folder for each locale and inside that folder add a `resources.js` file with the translated strings. See the `resources.js` file in the `nls/fr` folder for an example of this in French.
    - **/boilerplate/:** These are boilerplate specific classes and logic.
        -  **Boilerplate.js:** Module that takes care of "application"-specific work like retrieving the application configuration settings by appid, getting the url parameters (web map id and appid), and retrieving organization specific info if applicable. You will not need to modify this file. Also sets the [proxy](https://developers.arcgis.com/en/javascript/jshelp/ags_proxy.html) and geometry service if the url's have been provided in the config.json file or are available from the org. Once executed you'll have access to an object that contains properties that give you access to the following:
            - application specific properties
            - appid
            - webmap
            - helperServices: geometry, print, locator service urls
            - proxy url
        - **demoWebmap.json:** An example local webmap JSON file. Can be turned on in the boilerplate `settings.json`.
        - **demoWebscene.json:** An example local webscene JSON file. Can be turned on in the boilerplate `settings.json`.
        - **settings.json:** Customize how the boilerplate operates by editing this file.
- **/resources/:** Contains helpful files for your application.
    - **resources/configurationPanel.js** Default configuration panel settings for the template. This is only applicable to configurable templates. This example will create a configuration panel with one dropdown list that contains three template color choices (seaside, chrome, pavement). When the templateConfig.js module retrieves any configurable settings you'll get the theme name back in a parameter named theme. Then you can apply the necessary css to your application to apply the new colors - like change the border color etc. See the [Adding configurable parameters to templates](http://doc.arcgis.com/en/arcgis-online/create-maps/configurable-templates.htm) help topic for more details.
- **index.html**: The default html file for the application.

# API

This is the API for the boilerplate class. `Boilerplate.js`

## Constructor

`new BoilerPlate(options)`

## Constructor Options

See [boilerplate settings](#boilerplate-settings) for more information.

|property|type
|---|---|---|
|webscene|Object|
|webmap|Object|
|group|Object|
|portal|Object|
|urlItems|String[]|
|webTierSecurity|Boolean|
|esriEnvironment|Boolean|

## Properties

|property|description|type|readonly
|---|---|---|---|
|settings|Boilerplate settings|Object|true|
|config|Config created|Object|true|
|results|Boilerplate query results|Object|true|
|portal|`Portal` created by Boilerplate|`esri/portal/Portal`|true|
|direction|Language direction|String|true|
|units|Appropriate units of measurement|String|true|
|userPrivileges|Boilerplate user privileges|Object|true|

## Events

None

## Methods

### queryGroupItems

Query a group by parameters. `Boilerplate.queryGroupItems(options)`.

#### Options

```js
{
  "query": "group:\"{groupid}\" AND -type:\"Code Attachment\"",
  "sortField": "modified",
  "sortOrder": "desc",
  "num": 9,
  "start": 0
}
```

# Setup

## Getting Started

Review the following ArcGIS.com help topics for details on Templates:

*	[Writing your first application](https://developers.arcgis.com/en/javascript/jstutorials/intro_firstmap_amd.html)
*   [Make your first app](http://doc.arcgis.com/en/arcgis-online/create-maps/make-your-first-app.htm)
*   [Create apps from maps](http://doc.arcgis.com/en/arcgis-online/create-maps/create-app-templates.htm)
*   [Add configurable parameters to templates](http://doc.arcgis.com/en/arcgis-online/create-maps/configurable-templates.htm)

## Instructions

1. Download and unzip the .zip file or clone the repository.
2. Web-enable the directory.
3. Access the .html page.
4. Start writing your template!

[New to Github? Get started here.](https://github.com/)

## Deploying

1. To deploy this application, download the template from Portal/ArcGIS Online and unzip it.
2. Copy the unzipped folder containing the web app template files, such as index.html, to your web server. You can rename the folder to change the URL through which users will access the application. By default the URL to the app will be `http://<Your Web Server>/<app folder name>/index.html`
3. Change the portalUrl, found in config.json inside the config folder for the application, to the portalUrl for ArcGIS Online or Portal. For ArcGIS Online users, keep the default value of www.arcgis.com or specify the name of your organization.
  - ArcGIS Online Example:  `"portalUrl": location.protocol + "//" + “<your organization name>.maps.arcgis.com`
  - Portal Example where `arcgis` is the name of the Web Adaptor: `"portalUrl": location.protocol + "//" + "webadaptor.domain.com/arcgis"`
4. If you are using Portal or a local install of the ArcGIS API for JavaScript, change all references to the ArcGIS API for JavaScript in index.html to refer to your local copy of the API. Search for the references containing `"//js.arcgis.com/4.0"` and replace this portion of the reference with the url to your local install.
  - For example: `"//webadaptor.domain.com/arcgis/jsapi/jsapi"` where `arcgis` is the name of your Web Adaptor.
5. Copy a map or group ID from Portal/ArcGIS Online and replace the default web map ID in the application’s index.html page. You can now run the application on your web server or customize the application further.

> **Note:** If your application edits features in a feature service, contains secure services or web maps that aren't shared publicly, or generate requests that exceed 200 characters, you may need to set up and use a proxy page. Common situations where you may exceed the URL length are using complex polygons as input to a task or specifying a spatial reference using well-known text (WKT). For details on installing and configuring a proxy page see [Using the proxy](https://developers.arcgis.com/javascript/jshelp/ags_proxy.html). If you do not have an Internet connection, you will need to access and deploy the ArcGIS API for JavaScript documentation from [developers.arcgis.com](https://developers.arcgis.com/).

## Requirements

* Text or HTML editor.
* A little background with JavaScript.
* Experience with the [ArcGIS JavaScript API](http://www.esri.com/) would help.

## Resources

* [Community](https://developers.arcgis.com/en/javascript/jshelp/community.html)
* [ArcGIS for JavaScript API Resource Center](https://js.arcgis.com)
* [ArcGIS Blog](http://blogs.esri.com/esri/arcgis/)
* [twitter@esri](http://twitter.com/esri)

## Issues

Find a bug or want to request a new feature?  Please let us know by submitting an issue.

## Contributing

Esri welcomes contributions from anyone and everyone. Please see our [guidelines for contributing](https://github.com/esri/contributing).

## Licensing

Copyright 2013 Esri

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

A copy of the license is available in the repository's [license.txt](https://raw.github.com/Esri/application-boilerplate-js/master/license.txt) file.

[](Esri Tags: ArcGIS ArcGIS Online Web Application boilerplate template widget dijit Esri JavaScript application)
[](Esri Language: JavaScript)
