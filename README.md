# application-boilerplate-js

The Application Boilerplate is a starter application for building custom templates with the ArcGIS API for JavaScript.

## Features
This bare-bones app includes all the code you need to build an ArcGIS Online template. It will save you time when:

*	Making an ArcGIS Online compatible template.
*	Using your ArcGIS Online webmap to power the template.
*	Localizing your application in different languages.
*	Capturing URL parameters and using them in your application.
*	Using settings from your ArcGIS Online organization or configured application.
*	Enabling your application to sign-in to ArcGIS Online using [OAuth 2.0](http://oauth.net/2/).

[View it live](http://esri.github.io/application-boilerplate-js/application_boilerplate/)

![App](https://raw.github.com/Esri/application-boilerplate-js/master/application_boilerplate/images/thumb.png)

## Getting Started

Review the following ArcGIS.com help topics for details on Templates:

*	[Writing your first application](https://developers.arcgis.com/en/javascript/jstutorials/intro_firstmap_amd.html)
*   [About web application templates](http://resources.arcgis.com/en/help/arcgisonline/#/*   About_web_application_templates/010q000000nt000000/)
*   [Creating web application templates](http://resources.arcgis.com/en/help/arcgisonline/#/Creating_web_application_templates/010q00000072000000)
*   [Adding configurable parameters to templates](http://resources.arcgis.com/en/help/arcgisonline/#/Adding_configurable_parameters_to_templates/010q000000ns000000/)

## Folders and Files

The template consists of the following folders and files:

**/config/:** A folder for your application's configuration files. 

*   **defaults.js:** Define the default configuration information for the template. You can use this file to specify things like a default web map id, a proxy url, default services, a Bing maps key, default color theme and other template-specific settings.
 
**/css/:** Contains the CSS files for the application.

*	**main.css** This file contains the map styles that set the margin, padding and initial height (100%).

**/images/**: Contains images used by the application.

**/js/**: Contains 3 JavaScript files and 1 folder:

*   **/nls/:** The nls folder contains a file called resources.js that contains the strings used by the application. If the application needs to be supported by [multiple locales](https://developers.arcgis.com/en/javascript/jshelp/localization.html) you can create a folder for each locale and inside that folder add a resources.js file with the translated strings. See the resources.js file in the nls/fr folder for an example of this in French.
*   **main.js:** Creates the map based on configuration info. You will write all your main application logic in here.
*   **template.js:** Module that takes care of "template"-specific work like retrieving the application configuration settings by appid, getting the url parameters (web map id and appid), handling localization details and retrieving organization specific info if applicable. You will most likely not need to modify this file. Also sets the [proxy](https://developers.arcgis.com/en/javascript/jshelp/ags_proxy.html) and geometry service if the url's have been provided in the defaults.js file or are available from the org. Once executed you'll have access to an object that contains properties that give you access to the following:
    *   Template specific properties
    *   appid
    *   webmap
    *   helperServices: geometry, print, locator service urls
    *   i18n: Strings and isRightToLeft property that can be used to determine if the application is being viewed from a language where text is read left-to-right like Hebrew or Arabic.
    *   proxy  url
*   **templateOptions.js:** Options file for configuring your template to query for specific resources and items. You can edit this file and your template can enable or disable querying for things such as localization files, ArcGIS group information, group items, custom url parameters, etc.
    
**index.html**: The default html file for the application.

**/resources/**: Contains helpful files for your application.
*   **resources/configurationPanel.js** Default configuration panel settings for the template. This is only applicable to configurable templates. This example will create a configuration panel with one dropdown list that contains three template color choices (seaside, chrome, pavement). When the templateConfig.js module retrieves any configurable settings you'll get the theme name back in a parameter named theme. Then you can apply the necessary css to your application to apply the new colors - like change the border color etc. See the [Adding configurable parameters to templates](http://resources.arcgis.com/en/help/arcgisonline/#/Adding_configurable_parameters_to_templates/010q000000ns000000/) help topic for more details.

## Instructions

1. Download and unzip the .zip file or clone the repository.
2. Web-enable the directory.
3. Access the .html page.
4. Start writing your template!

[New to Github? Get started here.](https://github.com/)

## Requirements

* Text or HTML editor.
* A little background with JavaScript.
* Experience with the [ArcGIS JavaScript API](http://www.esri.com/) would help.

## Resources

* [Community](https://developers.arcgis.com/en/javascript/jshelp/community.html)
* [ArcGIS for JavaScript API Resource Center](http://help.arcgis.com/en/webapi/javascript/arcgis/index.html)
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
