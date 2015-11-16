/*global define,location */
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
  //Default configuration settings for the application. This is where you'll define things like a bing maps key,
  //default web scene, default app color theme and more. These values can be overwritten by template configuration settings and url parameters.
  "appid": "",
  "webscene": "19faa71a3bf6468cae35b4fce9393a7d",
  "oauthappid": null, //"AFTKRmv16wj14N3z",
  //Enter the url to the proxy if needed by the application. See the 'Using the proxy page' help topic for details
  //http://developers.arcgis.com/en/javascript/jshelp/ags_proxy.html
  "proxyurl": "",
  //Example of a template specific property. If your template had several color schemes
  //you could define the default here and setup configuration settings to allow users to choose a different
  //color theme.
  "theme": "blue",
  "sharinghost": location.protocol + "//" + "www.arcgis.com",
  "units": null,
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
});