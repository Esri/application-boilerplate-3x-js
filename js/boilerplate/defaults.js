define({
  // Use a local hosted web scene instead of a web scene on ArcGIS or portal.
  "useLocalWebScene": false,
  // support sending credentials with AJAX requests to specific domains. This will allow editing of feature services secured with web-tier authentication
  "webTierSecurity": false,
  // Webmap file to use for the local web scene
  "localWebSceneFile": "config/demoScene",
  //When true the template will query arcgis.com for default settings for helper services, units etc. If you
  //want to use custom settings for units or any of the helper services set queryForOrg to false then enter
  //default values for any items you need using the helper services and units properties.
  "queryForOrg": true,
  //If you need localization set the localize value to true to get the localized strings
  //from the javascript/nls/resource files.
  //Note that we've included a placeholder nls folder and a resource file with one error string
  //to show how to setup the strings file.
  "queryForLocale": true,
  //This option demonstrates how to handle additional custom url parameters. For example
  //if you want users to be able to specify lat/lon coordinates that define the scene's center or
  //specify an alternate basemap via a url parameter.
  "urlItems": [
    "embed",
    "components", //"zoom","logo","compass","attribution" or [] for none
    "viewpoint" // viewpoint=cam:posx,posy,posz, [wkid];[heading],[tilt]
  ],
  // Most users will not need to modify this value. For esri hosting environments only. Will automatically create a "sharinghost" and "proxyurl" for the application. Only set this is to true if the app is going to be stored on Esri's hosting servers. If you are using your own custom hosted portal, set the "sharinghost" in defaults.js instead of setting this to true.
  esriEnvironment: false
});
