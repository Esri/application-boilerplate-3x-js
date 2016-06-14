/*
  Version 1beta
  10/15/2015
*/
/*global define,document,location,require */
/*jslint sloppy:true,nomen:true,plusplus:true */
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
define(["dojo/_base/array", "dojo/_base/declare", "dojo/_base/kernel", "dojo/_base/lang", "dojo/_base/url",

"dojo/io-query",

"dojo/Evented", "dojo/Deferred", "dojo/string",

"dojo/dom-class",

"dojo/promise/all",

"esri/config", "esri/identity/IdentityManager", "esri/identity/OAuthInfo",

"esri/portal/Portal", "esri/portal/PortalItem",

"config/defaults"], function (
array, declare, kernel, lang, Url, ioQuery, Evented, Deferred, string, domClass, all, esriConfig, esriId, OAuthInfo, Portal, PortalItem, defaults) {
    return declare([Evented], {
        config: {},
        orgConfig: {},
        appConfig: {},
        urlConfig: {},
        i18nConfig: {},
        itemConfig: {},
        customUrlConfig: {},
        commonUrlItems: ["webscene", "appid", "oauthappid"],
        constructor: function (templateConfig) {
            // template settings
            var defaultTemplateConfig = {
                queryForWebmap: true
            };
            this.templateConfig = lang.mixin(defaultTemplateConfig, templateConfig);
            // config will contain application and user defined info for the application such as i18n strings the web scene id and application id, any url parameters and any application specific configuration information.
            this.config = defaults;
            // Gets parameters from the URL, convert them to an object and remove HTML tags.
            this.urlObject = this._createUrlParamsObject();
        },
        startup: function () {
            var promise = this._init();
            promise.then(lang.hitch(this, function (config) {
                // optional ready event to listen to
                this.emit("ready", config);
            }), lang.hitch(this, function (error) {
                // optional error event to listen to
                this.emit("error", error);
            }));
            return promise;
        },
        // Get URL parameters and set application defaults needed to query arcgis.com for
        // an application and to see if the app is running in Portal or an Org
        _init: function () {
            var deferred;
            deferred = new Deferred();
            // Set the web scene and appid if they exist but ignore other url params.
            // Additional url parameters may be defined by the application but they need to be mixed in
            // to the config object after we retrieve the application configuration info. As an example,
            // we'll mix in some commonly used url parameters after
            // the application configuration has been applied so that the url parameters overwrite any
            // configured settings. It's up to the application developer to update the application to take
            // advantage of these parameters.
            this.urlConfig = this._getUrlParamValues(this.commonUrlItems);
            // This demonstrates how to handle additional custom url parameters. For example
            // if you want users to be able to specify lat/lon coordinates that define the map's center or
            // specify an alternate basemap via a url parameter.
            // If these options are also configurable these updates need to be added after any
            // application default and configuration info has been applied. Currently these values
            // (center, basemap, theme) are only here as examples and can be removed if you don't plan on
            // supporting additional url parameters in your application.
            this.customUrlConfig = this._getUrlParamValues(this.templateConfig.urlItems);
            // config defaults <- standard url params
            // we need the web scene, appid,and oauthappid to query for the data
            this._mixinAll();
            // Define the sharing url and other default values like the proxy.
            // The sharing url defines where to search for the web map and application content. The
            // default value is arcgis.com.
            this._initializeApplication();
            // check if signed in. Once we know if we're signed in, we can get appConfig, orgConfig and create a portal if needed.
            this._checkSignIn().always(lang.hitch(this, function () {
                // execute these tasks async
                all({
                    // get localization
                    i18n: this._queryLocalization(),
                    // get application data
                    app: this.queryApplication(),
                    // get org data
                    org: this.queryOrganization()
                }).then(lang.hitch(this, function () {
                    // mixin all new settings from org and app
                    this._mixinAll();
                    // then execute these async
                    all({
                        // webscene item
                        item: this.queryItem(),

                    }).then(lang.hitch(this, function () {
                        // mixin all new settings from item.
                        this._mixinAll();
                        // We have all we need, let's set up a few things
                        this._completeApplication();
                        deferred.resolve(this.config);
                    }), deferred.reject);
                }), deferred.reject);
            }));
            // return promise
            return deferred.promise;
        },
        _completeApplication: function () {
            // ArcGIS.com allows you to set an application extent on the application item. Overwrite the
            // existing web map extent with the application item extent when set.
            if (this.config.appid && this.config.application_extent && this.config.application_extent.length > 0 && this.config.itemInfo && this.config.itemInfo.item && this.config.itemInfo.item.extent) {
                this.config.itemInfo.item.extent = [
                    [
                    parseFloat(this.config.application_extent[0][0]), parseFloat(this.config.application_extent[0][1])],
                    [
                    parseFloat(this.config.application_extent[1][0]), parseFloat(this.config.application_extent[1][1])]
                ];
            }
            // TODO do we need geometry service for scene?
            // if so do we have config option to set geom service at 4?
        },
        _mixinAll: function () {
/*
      mix in all the settings we got!
      {} <- i18n <- organization <- application <- web scene <- custom url params <- standard url params.
      */
            lang.mixin(this.config, this.i18nConfig, this.orgConfig, this.appConfig, this.itemConfig, this.customUrlConfig, this.urlConfig);
        },
        _getUrlParamValues: function (items) {
            // retrieves only the items specified from the URL object.
            var urlObject = this.urlObject;
            var obj = {};
            if (urlObject && urlObject.query && items && items.length) {
                for (var i = 0; i < items.length; i++) {
                    var item = urlObject.query[items[i]];
                    if (item) {
                        if (typeof item === "string") {
                            switch (item.toLowerCase()) {
                            case "true":
                                obj[items[i]] = true;
                                break;
                            case "false":
                                obj[items[i]] = false;
                                break;
                            default:
                                obj[items[i]] = item;
                            }
                        } else {
                            obj[items[i]] = item;
                        }
                    }
                }
            }
            return obj;
        },
        _createUrlParamsObject: function () {
            var urlObject, url;
            // retrieve url parameters. Templates all use url parameters to determine which arcgis.com
            // resource to work with.
            // Scene templates use the webscene param to define the scene to display
            // appid is the id of the application based on the template. We use this
            // id to retrieve application specific configuration information. The configuration
            // information will contain the values the  user selected on the template configuration
            // panel.
            url = document.location.href;
            urlObject = this._urlToObject(url);
            urlObject.query = urlObject.query || {};
            // remove any HTML tags from query item
            urlObject.query = this._stripTags(urlObject.query);
            return urlObject;
        },
        _initializeApplication: function () {
            // If this app is hosted on an Esri environment.
            if (this.templateConfig.esriEnvironment) {
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
                }
            }
            esriConfig.portalUrl = this.config.sharinghost;
            // Define the proxy url for the app
            if (this.config.proxyurl) {
                esriConfig.request.proxyUrl = this.config.proxyurl;
            }
        },
        _checkSignIn: function () {
            var deferred, signedIn, oAuthInfo;
            deferred = new Deferred();
            //If there's an oauth appid specified register it
            if (this.config.oauthappid) {
                oAuthInfo = new OAuthInfo({
                    appId: this.config.oauthappid,
                    portalUrl: this.config.sharinghost,
                    popup: true
                });
                esriId.registerOAuthInfos([oAuthInfo]);
            }
            // check sign-in status
            signedIn = esriId.checkSignInStatus(this.config.sharinghost + "/sharing");
            // resolve regardless of signed in or not.
            signedIn.always(function () {
                deferred.resolve();
            });
            return deferred.promise;
        },
        _queryLocalization: function () {
            var deferred, dirNode, classes, rtlClasses;
            deferred = new Deferred();
            if (this.templateConfig.queryForLocale) {
                require(["dojo/i18n!application/nls/resources"], lang.hitch(this, function (appBundle) {
                    var cfg = {};
                    // Get the localization strings for the template and store in an i18n variable. Also determine if the
                    // application is in a right-to-left language like Arabic or Hebrew.
                    cfg.i18n = appBundle || {};
                    // Bi-directional language support added to support right-to-left languages like Arabic and Hebrew
                    // Note: The map must stay ltr
                    cfg.i18n.direction = "ltr";
                    array.some(["ar", "he"], lang.hitch(this, function (l) {
                        if (kernel.locale.indexOf(l) !== -1) {
                            cfg.i18n.direction = "rtl";
                            return true;
                        }
                        return false;
                    }));
                    // add a dir attribute to the html tag. Then you can add special css classes for rtl languages
                    dirNode = document.getElementsByTagName("html")[0];
                    classes = dirNode.className + " ";
                    if (cfg.i18n.direction === "rtl") {
                        // need to add support for dj_rtl.
                        // if the dir node is set when the app loads dojo will handle.
                        dirNode.setAttribute("dir", "rtl");
                        rtlClasses = " esriRTL dj_rtl dijitRtl " + classes.replace(/ /g, "-rtl ");
                        dirNode.className = lang.trim(classes + rtlClasses);
                    } else {
                        dirNode.setAttribute("dir", "ltr");
                        domClass.add(dirNode, "esriLTR");
                    }
                    this.i18nConfig = cfg;
                    deferred.resolve(cfg);
                }));
            } else {
                deferred.resolve();
            }
            return deferred.promise;
        },
        queryItem: function () {
            var deferred, cfg = {};
            // Get details about the specified web scene. If the web scene is not shared publicly users will
            // be prompted to log-in by the Identity Manager.
            deferred = new Deferred();
            // Use local web scene instead of portal web scene
            if (this.templateConfig.useLocalWebScene) {
                // get web scene js file
                require(["dojo/text!./config/demoScene.json","dojo/json"], lang.hitch(this, function (data,JSON) {
                    // return web scene json
                    cfg.itemInfo = JSON.parse(data);
                    this.itemConfig = cfg;
                    deferred.resolve(cfg);
                }));
            }
            // no web scene is set and we have organization's info
            else if (!this.config.webscene && this.config.orgInfo) {
                var defaultWebScene = {
                    "item": {
                        "title": "Default Webscene",
                        "type": "Web Scene",
                        "description": "A web scene with the default basemap and extent.",
                        "snippet": "A web scene with the default basemap and extent.",
                        "extent": this.config.orgInfo.defaultExtent
                    },
                    "itemData": {
                        "operationalLayers": [],
                        "baseMap": this.config.orgInfo.defaultBasemap
                    }
                };
                cfg.itemInfo = defaultWebScene;
                this.itemConfig = cfg;
                deferred.resolve(cfg);
            }
            // use webscene from id
            else {
                deferred.resolve(cfg);
            }

            return deferred.promise;
        },
        queryApplication: function () {
            // Get the application configuration details using the application id. When the response contains
            // itemData.values then we know the app contains configuration information. We'll use these values
            // to overwrite the application defaults.
            var deferred = new Deferred();
            if (this.config.appid) {

                var sceneItem = new PortalItem({
                    id: this.config.appid
                }).load();
                sceneItem.then(lang.hitch(this, function (itemData) {
                    var cfg = {};
                    if (ritemData && itemData.values) {
                        // get app config values - we'll merge them with config later.
                        cfg = itemData.values;
                        // save response
                        cfg.appResponse = response;
                    }

                    // TODO (No support yet for app proxies in the scene)
                    this.appConfig = cfg;
                    deferred.resolve(cfg);
                }), function (error) {
                    if (!error) {
                        error = new Error("Error retrieving application configuration.");
                    }
                    deferred.reject(error);
                });
            } else {
                deferred.resolve();
            }
            return deferred.promise;
        },
        queryOrganization: function () {
            var deferred = new Deferred();
            if (this.templateConfig.queryForOrg) {
                // Query the ArcGIS.com organization. This is defined by the sharinghost that is specified. For example if you
                // are a member of an org you'll want to set the sharinghost to be http://<your org name>.arcgis.com. We query
                // the organization by making a self request to the org url which returns details specific to that organization.
                // Examples of the type of information returned are custom roles, units settings, helper services and more.
                // If this fails, the application will continue to function
                var portal = new Portal().load();
                portal.then(lang.hitch(this, function (response) {
                    if (this.templateConfig.webTierSecurity) {
                        var trustedHost;
                        if (response.authorizedCrossOriginDomains && response.authorizedCrossOriginDomains.length > 0) {
                            for (var i = 0; i < response.authorizedCrossOriginDomains.length; i++) {
                                trustedHost = response.authorizedCrossOriginDomains[i];
                                // add if trusted host is not null, undefined, or empty string
                                if (this._isDefined(trustedHost) && trustedHost.length > 0) {
                                    esriConfig.request.corsEnabledServers.push({
                                        host: trustedHost,
                                        withCredentials: true
                                    });
                                }
                            }
                        }
                    }
                    var cfg = {};
                    // save organization information
                    cfg.orgInfo = response;
                    // get units defined by the org or the org user
                    cfg.units = "metric";
                    if (response.user && response.user.units) { //user defined units
                        cfg.units = response.user.units;
                    } else if (response.units) { //org level units
                        cfg.units = response.units;
                    } else if ((response.user && response.user.region && response.user.region === "US") || (response.user && !response.user.region && response.region === "US") || (response.user && !response.user.region && !response.region) || (!response.user && response.ipCntryCode === "US") || (!response.user && !response.ipCntryCode && kernel.locale === "en-us")) {
                        // use feet/miles only for the US and if nothing is set for a user
                        cfg.units = "english";
                    }
                    // Get the helper services (routing, print, locator etc)
                    cfg.helperServices = response.helperServices;
                    // are any custom roles defined in the organization?
                    if (response.user && this._isDefined(response.user.roleId)) {
                        if (response.user.privileges) {
                            cfg.userPrivileges = response.user.privileges;
                        }
                    }
                    this.orgConfig = cfg;
                    deferred.resolve(cfg);
                }), function (error) {
                    if (!error) {
                        error = new Error("Error retrieving organization information.");
                    }
                    deferred.reject(error);
                });
            } else {
                deferred.resolve();
            }
            return deferred.promise;
        },
        _isDefined: function (value) {
            return (value !== undefined) && (value !== null);
        },
        _stripTags: function (data) {
            var tagsRegex = /<\/?[^>]+>/g;
            if (data) {
                // get type of data
                var t = typeof data;
                if (t === "string") {
                    // remove tags from a string
                    data = data.replace(tagsRegex, "");
                } else if (t === "object") {
                    // remove tags from an object
                    for (var item in data) {
                        var currentItem = data[item];
                        if (currentItem && typeof currentItem === "string") {
                            //strip html tags
                            currentItem = currentItem.replace(tagsRegex, "");
                        }
                        // set item back on data
                        data[item] = currentItem;
                    }
                }
            }
            return data;
        },
        _urlToObject: function (url) {
            var r = {},
                dojoUrl = new Url(url),
                iq = url.indexOf("?");

            // Check if url has query parameters
            // Update the return object
            if (dojoUrl.query === null) {
                r = {
                    path: url,
                    query: null
                };
            } else {
                r.path = url.substring(0, iq);
                r.query = ioQuery.queryToObject(dojoUrl.query);
            }

            // Append the Hash
            if (dojoUrl.fragment) {
                r.hash = dojoUrl.fragment;
                if (dojoUrl.query === null) {
                    // Remove the hash from the path ( length+1 to include '#')
                    r.path = r.path.substring(0, r.path.length - (dojoUrl.fragment.length + 1));
                }
            }

            return r;
        }
    });
});