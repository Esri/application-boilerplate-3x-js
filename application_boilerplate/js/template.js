/*global define,document,location,require */
/*jslint sloppy:true,nomen:true,plusplus:true */
define([
    "dojo/Evented",
    "dojo/_base/declare",
    "dojo/_base/kernel",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/dom-class",
    "dojo/Deferred",
    "dojo/promise/all",
    "esri/arcgis/utils",
    "esri/urlUtils",
    "esri/request",
    "esri/config",
    "esri/lang",
    "esri/IdentityManager",
    "esri/tasks/GeometryService",
    "config/defaults",
    "application/OAuthHelper"
], function (
    Evented,
    declare,
    kernel,
    array,
    lang,
    domClass,
    Deferred,
    all,
    arcgisUtils,
    urlUtils,
    esriRequest,
    esriConfig,
    esriLang,
    IdentityManager,
    GeometryService,
    defaults,
    OAuthHelper
) {
    return declare([Evented], {
        config: {},
        orgConfig: {},
        appConfig: {},
        urlConfig: {},
        customUrlConfig: {},
        commonConfig: {},
        constructor: function () {
            // config will contain application and user defined info for the application such as i18n strings,
            // the web map id and application id, any url parameters and any application specific configuration
            // information.
            this.config = defaults;
        },
        startup: function () {
            var deferred = this._init();
            deferred.then(lang.hitch(this, function (config) {
                // optional ready event to listen to
                this.emit("ready", config);
            }), lang.hitch(this, function (error) {
                // optional error event to listen to
                this.emit("error", error);
            }));
            return deferred;
        },
        // Get URL parameters and set application defaults needed to query arcgis.com for
        // an application and to see if the app is running in Portal or an Org
        _init: function () {
            var deferred, paramItems;

            deferred = new Deferred();
            // Set the web map, group and appid if they exist but ignore other url params.
            // Additional url parameters may be defined by the application but they need to be mixed in
            // to the config object after we retrieve the application configuration info. As an example,
            // we'll mix in some commonly used url parameters in the _queryUrlParams function after
            // the application configuration has been applied so that the url parameters overwrite any
            // configured settings. It's up to the application developer to update the application to take
            // advantage of these parameters.
            paramItems = ["webmap", "appid", "group", "oauthappid"];
            this.urlConfig = this._createUrlParamsObject(paramItems);
            // config defaults <- standard url params
            // we need the webmap, appid, group and oauthappid to query for the data
            lang.mixin(this.config, this.urlConfig);
            // Define the sharing url and other default values like the proxy.
            // The sharing url defines where to search for the web map and application content. The
            // default value is arcgis.com.
            this._initializeApplication();
            // execute these async
            all({
                // check if signed in
                auth: this._checkSignIn(),
                // get localization
                i18n: this._getLocalization(),
                // get application data
                app: this._queryApplicationConfiguration(),
                // common config file
                common: this._getCommonConfig()
            }).then(lang.hitch(this, function () {
                // then execute these async
                all({
                    // get item data
                    item: this._queryDisplayItem(),
                    // get org data
                    org: this._queryOrganizationInformation()
                }).then(lang.hitch(this, function () {
                    // Get any custom url params
                    this._queryUrlParams();
                    // mix in all the settings we got!
                    // defaults <- common config <- organization <- application id config <- custom url params <- standard url params
                    lang.mixin(this.config, this.commonConfig, this.orgConfig, this.appConfig, this.customUrlConfig, this.urlConfig);
                    // Set the geometry helper service to be the app default.
                    if (this.config.helperServices && this.config.helperServices.geometry && this.config.helperServices.geometry.url) {
                        esriConfig.defaults.geometryService = new GeometryService(this.config.helperServices.geometry.url);
                    }
                    // setup OAuth if oauth appid exists_initializeApplication
                    if (this.config.oauthappid) {
                        this._setupOAuth(this.config.oauthappid, this.config.sharinghost);
                    }
                    deferred.resolve(this.config);
                }), deferred.reject);
            }), deferred.reject);
            // return promise
            return deferred.promise;
        },
        _getCommonConfig: function(){
            var deferred;
            deferred = new Deferred();
            if (this.config.commonConfig) {
                require(["arcgis_templates/commonConfig"], lang.hitch(this, function (response) {
                    this.commonConfig = response;
                    deferred.resolve(true);
                }));
            } else {
                deferred.resolve(true);
            }
            return deferred.promise;
        },
        _createUrlParamsObject: function (items) {
            var urlObject, obj = {}, i;

            // retrieve url parameters. Templates all use url parameters to determine which arcgis.com
            // resource to work with.
            // Map templates use the webmap param to define the webmap to display
            // Group templates use the group param to provide the id of the group to display.
            // appid is the id of the application based on the template. We use this
            // id to retrieve application specific configuration information. The configuration
            // information will contain the values the  user selected on the template configuration
            // panel.
            urlObject = urlUtils.urlToObject(document.location.href);
            urlObject.query = urlObject.query || {};
            if (urlObject.query && items && items.length) {
                for (i = 0; i < items.length; i++) {
                    if (urlObject.query[items[i]]) {
                        obj[items[i]] = urlObject.query[items[i]];
                    }
                }
            }
            return obj;
        },
        _initializeApplication: function () {
            var appLocation, instance;

            // Check to see if the app is hosted or a portal. If the app is hosted or a portal set the
            // sharing url and the proxy. Otherwise use the sharing url set it to arcgis.com.
            // We know app is hosted (or portal) if it has /apps/ or /home/ in the url.
            appLocation = location.pathname.indexOf("/apps/");
            if (appLocation === -1) {
                appLocation = location.pathname.indexOf("/home/");
            }
            // app is hosted and no sharing url is defined so let's figure it out.
            if (appLocation !== -1) {
                // hosted or portal
                instance = location.pathname.substr(0, appLocation); //get the portal instance name
                this.config.sharinghost = location.protocol + "//" + location.host + instance;
                this.config.proxyurl = location.protocol + "//" + location.host + instance + "/sharing/proxy";
            } else {
                // setup OAuth if oauth appid exists. If we don't call it here before querying for appid
                // the identity manager dialog will appear if the appid isn't publicly shared.
                if (this.config.oauthappid) {
                    this._setupOAuth(this.config.oauthappid, this.config.sharinghost);
                }
            }
            arcgisUtils.arcgisUrl = this.config.sharinghost + "/sharing/rest/content/items";
            // Define the proxy url for the app
            if (this.config.proxyurl) {
                esriConfig.defaults.io.proxyUrl = this.config.proxyurl;
                esriConfig.defaults.io.alwaysUseProxy = false;
            }
        },
        _checkSignIn: function () {
            var deferred, signedIn;

            deferred = new Deferred();
            // check sign-in status
            signedIn = IdentityManager.checkSignInStatus(this.config.sharinghost + "/sharing");
            // resolve regardless of signed in or not.
            signedIn.promise.always(function () {
                deferred.resolve(true);
            });
            return deferred.promise;
        },
        _setupOAuth: function (id, portal) {
            OAuthHelper.init({
                appId: id,
                portal: portal,
                expiration: (14 * 24 * 60) //2 weeks (in minutes)
            });
        },
        _getLocalization: function () {
            var deferred, dirNode, classes, rtlClasses;

            deferred = new Deferred();
            if (this.config.localize) {
                require(["dojo/i18n!application/nls/resources"], lang.hitch(this, function (appBundle) {
                    // Get the localization strings for the template and store in an i18n variable. Also determine if the
                    // application is in a right-to-left language like Arabic or Hebrew.
                    this.config.i18n = appBundle || {};
                    // Bi-directional language support added to support right-to-left languages like Arabic and Hebrew
                    // Note: The map must stay ltr
                    this.config.i18n.direction = "ltr";
                    array.some(["ar", "he"], lang.hitch(this, function (l) {
                        if (kernel.locale.indexOf(l) !== -1) {
                            this.config.i18n.direction = "rtl";
                            return true;
                        }
                        return false;
                    }));
                    // add a dir attribute to the html tag. Then you can add special css classes for rtl languages
                    dirNode = document.getElementsByTagName("html")[0];
                    classes = dirNode.className;
                    if (this.config.i18n.direction === "rtl") {
                        // need to add support for dj_rtl.
                        // if the dir node is set when the app loads dojo will handle.
                        dirNode.setAttribute("dir", "rtl");
                        rtlClasses = " esriRTL dj_rtl dijitRtl " + classes.replace(/ /g, "-rtl ");
                        dirNode.className = lang.trim(classes + rtlClasses);
                    } else {
                        dirNode.setAttribute("dir", "ltr");
                        domClass.add(dirNode, "esriLTR");
                    }
                    deferred.resolve(true);
                }));
            } else {
                deferred.resolve(true);
            }
            return deferred.promise;
        },
        _queryDisplayItem: function () {
            var deferred, itemId, error;

            // Get details about the specified web map or group. If the group or web map is not shared publicly users will
            // be prompted to log-in by the Identity Manager.
            deferred = new Deferred();
            if (this.config.webmap || this.config.group) {
                itemId = this.config.webmap || this.config.group;
                arcgisUtils.getItem(itemId).then(lang.hitch(this, function (itemInfo) {
                    // ArcGIS.com allows you to set an application extent on the application item. Overwrite the
                    // existing web map extent with the application item extent when set.
                    if (this.config.appid && this.config.application_extent.length > 0 && itemInfo.item.extent) {
                        itemInfo.item.extent = [
                            [
                                parseFloat(this.config.application_extent[0][0]),
                                parseFloat(this.config.application_extent[0][1])
                            ],
                            [
                                parseFloat(this.config.application_extent[1][0]),
                                parseFloat(this.config.application_extent[1][1])
                            ]
                        ];
                    }
                    // Set the itemInfo config option. This can be used when calling createMap instead of the webmap or group id
                    this.config.itemInfo = itemInfo;
                    deferred.resolve(true);
                }), function (error) {
                    if (!error) {
                        error = new Error("ApplicationBoilerplate:: Error retrieving display item.");
                    }
                    deferred.reject(error);
                });
            } else {
                error = new Error("ApplicationBoilerplate:: webmap or group undefined.");
                deferred.reject(error);
            }
            return deferred.promise;
        },
        _queryApplicationConfiguration: function () {
            // Get the application configuration details using the application id. When the response contains
            // itemData.values then we know the app contains configuration information. We'll use these values
            // to overwrite the application defaults.
            var deferred = new Deferred();
            if (this.config.appid) {
                arcgisUtils.getItem(this.config.appid).then(lang.hitch(this, function (response) {
                    if (response.item && response.itemData && response.itemData.values) {
                        // get app config values - we'll merge them with config later.
                        this.appConfig = response.itemData.values;
                        // save response
                        this.appResponse = response;
                        // Get the web map from the app values. But if there's a web url
                        // parameter don't overwrite with the app value.
                        var webmapParam = this._createUrlParamsObject(["webmap"]);
                        if (!esriLang.isDefined(webmapParam.webmap) && response.itemData.values.webmap && this.config.webmap) {
                            this.config.webmap = response.itemData.values.webmap;
                        }
                    }
                    // get the extent for the application item. This can be used to override the default web map extent
                    if (response.item && response.item.extent) {
                        this.config.application_extent = response.item.extent;
                    }
                    deferred.resolve(true);
                }), function (error) {
                    if (!error) {
                        error = new Error("ApplicationBoilerplate:: Error retrieving application configuration.");
                    }
                    deferred.reject(error);
                });
            } else {
                deferred.resolve(true);
            }
            return deferred.promise;
        },
        _queryOrganizationInformation: function () {
            var deferred = new Deferred();
            if (this.config.queryForOrg) {
                // Query the ArcGIS.com organization. This is defined by the sharinghost that is specified. For example if you
                // are a member of an org you'll want to set the sharinghost to be http://<your org name>.arcgis.com. We query
                // the organization by making a self request to the org url which returns details specific to that organization.
                // Examples of the type of information returned are custom roles, units settings, helper services and more.
                // If this fails, the application will continue to function
                esriRequest({
                    url: this.config.sharinghost + "/sharing/rest/portals/self",
                    content: {
                        "f": "json"
                    },
                    callbackParamName: "callback"
                }).then(lang.hitch(this, function (response) {
                    
                    //get the bing key if the organization has one 
                    if(response.bingKey){
                        this.orgConfig.bingmapskey = response.bingKey;
                    }
                    // get units defined by the org or the org user
                    this.orgConfig.units = "metric";
                    if (response.user && response.user.units) { //user defined units
                        this.orgConfig.units = response.user.units;
                    } else if (response.units) { //org level units
                        this.orgConfig.units = response.units;
                    } else if ((response.user && response.user.region && response.user.region === "US") || (response.user && !response.user.region && response.region === "US") || (response.user && !response.user.region && !response.region) || (!response.user && response.ipCntryCode === "US") || (!response.user && !response.ipCntryCode && kernel.locale === "en-us")) {
                        // use feet/miles only for the US and if nothing is set for a user
                        this.orgConfig.units = "english";
                    }
                    // Get the helper servcies (routing, print, locator etc)
                    this.orgConfig.helperServices = response.helperServices;
                    // are any custom roles defined in the organization?
                    if (response.user && esriLang.isDefined(response.user.roleId)) {
                        if (response.user.privileges) {
                            this.orgConfig.userPrivileges = response.user.privileges;
                        }
                    }
                    deferred.resolve(true);
                }), function (error) {
                    if (!error) {
                        error = new Error("ApplicationBoilerplate:: Error retrieving organization information.");
                    }
                    deferred.reject(error);
                });
            } else {
                deferred.resolve(true);
            }
            return deferred.promise;
        },
        _queryUrlParams: function () {
            // This function demonstrates how to handle additional custom url parameters. For example
            // if you want users to be able to specify lat/lon coordinates that define the map's center or
            // specify an alternate basemap via a url parameter.
            // If these options are also configurable these updates need to be added after any
            // application default and configuration info has been applied. Currently these values
            // (center, basemap, theme) are only here as examples and can be removed if you don't plan on
            // supporting additional url parameters in your application.
            this.customUrlConfig = this._createUrlParamsObject(this.config.urlItems);
        }
    });
});
