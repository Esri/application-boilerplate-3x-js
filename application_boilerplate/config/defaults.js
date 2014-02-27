define([], function() {
    //Default configuration settings for the application. This is where you'll define things like a bing maps key,
    //default web map, default app color theme and more. These values can be overwritten by template configuration settings
    //and url parameters.
    var defaults = {
        "appid": "",
        "webmap": "de5ae0c2040c49d38e9ea0637454ac73",
        "oauthappid": null, //"AFTKRmv16wj14N3z",
        //Group templates must support a group url parameter. This will contain the id of the group. 
        //group: "",
        //Enter the url to the proxy if needed by the application. See the 'Using the proxy page' help topic for details
        //http://developers.arcgis.com/en/javascript/jshelp/ags_proxy.html
        "proxyurl": "",
        //Example of a template specific property. If your template had several color schemes
        //you could define the default here and setup configuration settings to allow users to choose a different
        //color theme.  
        "theme": "blue",
        "bingmapskey": "", //Enter the url to your organizations bing maps key if you want to use bing basemaps
        //Defaults to arcgis.com. Set this value to your portal or organization host name.
        "sharinghost": location.protocol + "//" + "www.arcgis.com", 
        //When true the template will query arcgis.com for default settings for helper services, units etc. If you 
        //want to use custom settings for units or any of the helper services set queryForOrg to false then enter
        //default values for any items you need using the helper services and units properties. 
        "queryForOrg": true, 
        "units": null, 
        "helperServices": {  
           "geometry":{
            "url": null
           },
           "printTask": {
            "url": null
           },
           "elevationSync":{
             "url": null
           },
           "geocode": [{
            "url": null
           }]
        }
    };
    return defaults;
});
