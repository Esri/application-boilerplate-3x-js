var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
define(["require", "exports", "dojo/text!config/demoWebMap.json", "dojo/text!config/demoWebScene.json", "dojo/_base/kernel", "esri/config", "esri/core/promiseUtils", "esri/identity/IdentityManager", "esri/identity/OAuthInfo", "esri/portal/Portal", "esri/portal/PortalItem", "esri/portal/PortalQueryParams", "boilerplate/UrlParamHelper"], function (require, exports, webmapText, websceneText, kernel, esriConfig, promiseUtils, IdentityManager, OAuthInfo, Portal, PortalItem, PortalQueryParams, UrlParamHelper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /// <amd-dependency path="dojo/text!config/demoWebMap.json" name="webmapText" />
    /// <amd-dependency path="dojo/text!config/demoWebScene.json" name="websceneText" />
    var ESRI_PROXY_PATH = "/sharing/proxy";
    var ESRI_APPS_PATH = "/apps/";
    var ESRI_HOME_PATH = "/home/";
    var RTL_LANGS = ["ar", "he"];
    var LTR = "ltr";
    var RTL = "rtl";
    var LOCALSTORAGE_PREFIX = "boilerplate_config_";
    var DEFAULT_URL_PARAM = "default";
    // todo: have promise return results instead of setting using `this`
    var Boilerplate = (function () {
        function Boilerplate(applicationConfigJSON, boilerplateConfigJSON) {
            this.settings = {
                webscene: {},
                webmap: {},
                group: {},
                portal: {},
                urlItems: []
            };
            this.config = null;
            this.results = {
                group: {}
            };
            this.portal = null;
            this.direction = null;
            this.locale = null;
            this.units = null;
            this.userPrivileges = null;
            this.settings = __assign({}, boilerplateConfigJSON);
            this.config = applicationConfigJSON;
        }
        Boilerplate.prototype.queryGroupItems = function () {
            if (!this.settings.group.fetchItems || !this.config.group) {
                return promiseUtils.resolve();
            }
            var itemParams = this.settings.group.itemParams;
            var groupId = this.config.group;
            var paramOptions = __assign({ query: "group:\"" + groupId + "\" AND -type:\"Code Attachment\"", sortField: "modified", sortOrder: "desc", num: 9, start: 1 }, itemParams);
            var params = new PortalQueryParams(paramOptions);
            return this.portal.queryItems(params);
        };
        Boilerplate.prototype.init = function () {
            var _this = this;
            // Set the web scene and appid if they exist but ignore other url params.
            // Additional url parameters may be defined by the application but they need to be mixed in
            // to the config object after we retrieve the application configuration info. As an example,
            // we'll mix in some commonly used url parameters after
            // the application configuration has been applied so that the url parameters overwrite any
            // configured settings. It's up to the application developer to update the application to take
            // advantage of these parameters.
            // This demonstrates how to handle additional custom url parameters. For example
            // if you want users to be able to specify lat/lon coordinates that define the map's center or
            // specify an alternate basemap via a url parameter.
            // If these options are also configurable these updates need to be added after any
            // application default and configuration info has been applied. Currently these values
            // (center, basemap, theme) are only here as examples and can be removed if you don't plan on
            // supporting additional url parameters in your application.
            this.results.urlParams = UrlParamHelper_1.getUrlParamValues(this.settings.urlItems);
            // config defaults <- standard url params
            // we need the web scene, appid,and oauthappid to query for the data
            this._mixinAllConfigs();
            // Define the portalUrl and other default values like the proxy.
            // The portalUrl defines where to search for the web map and application content. The
            // default value is arcgis.com.
            this._initializeApplication();
            // determine boilerplate language properties
            this._setLangProps();
            // check if signed in. Once we know if we're signed in, we can get data and create a portal if needed.
            return this._checkSignIn(this.config.oauthappid, this.config.portalUrl).always(function () {
                // execute these tasks async
                return promiseUtils.eachAlways([
                    // get application data
                    _this._queryApplicationItem(_this.config.appid),
                    // get org data
                    _this._queryPortal()
                ]).always(function (args) {
                    var applicationResponse = args[0], portalResponse = args[1];
                    // gets a temporary config from the users local storage
                    _this.results.localStorageConfig = _this.settings.localConfig.fetch ?
                        _this._getLocalConfig(_this.config.appid) :
                        null;
                    _this.results.applicationItem = applicationResponse.value;
                    _this.results.portal = portalResponse.value;
                    // mixin all new settings from org and app
                    _this._mixinAllConfigs();
                    // let's set up a few things
                    _this._completeApplication();
                    // then execute these async
                    return promiseUtils.eachAlways([
                        // webmap item
                        _this._queryWebMapItem(),
                        // webscene item
                        _this._queryWebSceneItem(),
                        // group information
                        _this._queryGroupInfo(),
                        // items within a specific group
                        _this.queryGroupItems()
                    ]).always(function (args) {
                        var webMapResponse = args[0], webSceneResponse = args[1], groupInfoResponse = args[2], groupItemsResponse = args[3];
                        _this.results.webMapItem = webMapResponse.value;
                        _this.results.webSceneItem = webSceneResponse.value;
                        _this.results.group.itemsData = groupItemsResponse.value;
                        _this.results.group.infoData = groupInfoResponse.value;
                        return {
                            settings: _this.settings,
                            config: _this.config,
                            results: _this.results,
                            portal: _this.portal,
                            direction: _this.direction,
                            locale: _this.locale,
                            units: _this.units,
                            userPrivileges: _this.userPrivileges
                        };
                    });
                });
            });
        };
        Boilerplate.prototype._getLocalConfig = function (appid) {
            if (!(window.localStorage && appid)) {
                return;
            }
            var lsItem = localStorage.getItem(LOCALSTORAGE_PREFIX + appid);
            var localConfig = lsItem && JSON.parse(lsItem);
            return localConfig;
        };
        Boilerplate.prototype._queryWebMapItem = function () {
            // Get details about the specified web map. If the web map is not shared publicly users will
            // be prompted to log-in by the Identity Manager.
            if (!this.settings.webmap.fetch) {
                return promiseUtils.resolve();
            }
            // Use local web map instead of portal web map
            if (this.settings.webmap.useLocal) {
                var json = JSON.parse(webmapText);
                return promiseUtils.resolve({ json: json });
            }
            // use webmap from id
            if (this.config.webmap) {
                var mapItem = new PortalItem({
                    id: this.config.webmap
                });
                return mapItem.load().then(function (itemData) {
                    return { data: itemData };
                }).otherwise(function (error) {
                    return { error: error || new Error("Boilerplate:: Error retrieving webmap item.") };
                });
            }
            return promiseUtils.resolve();
        };
        Boilerplate.prototype._queryGroupInfo = function () {
            // Get details about the specified group. If the group is not shared publicly users will
            // be prompted to log-in by the Identity Manager.
            if (!this.settings.group.fetchInfo || !this.config.group) {
                return promiseUtils.resolve();
            }
            // group params
            var params = new PortalQueryParams({
                query: "id:\"" + this.config.group + "\""
            });
            return this.portal.queryGroups(params);
        };
        Boilerplate.prototype._queryWebSceneItem = function () {
            // Get details about the specified web scene. If the web scene is not shared publicly users will
            // be prompted to log-in by the Identity Manager.
            if (!this.settings.webscene.fetch) {
                return promiseUtils.resolve();
            }
            // Use local web scene instead of portal web scene
            if (this.settings.webscene.useLocal) {
                // get web scene js file
                var json = JSON.parse(websceneText);
                return promiseUtils.resolve({ json: json });
            }
            // use webscene from id
            if (this.config.webscene) {
                var sceneItem = new PortalItem({
                    id: this.config.webscene
                });
                return sceneItem.load().then(function (itemData) {
                    return { data: itemData };
                }).otherwise(function (error) {
                    return { error: error || new Error("Boilerplate:: Error retrieving webscene item.") };
                });
            }
            return promiseUtils.resolve();
        };
        Boilerplate.prototype._queryApplicationItem = function (appid) {
            // Get the application configuration details using the application id. When the response contains
            // itemData.values then we know the app contains configuration information. We'll use these values
            // to overwrite the application defaults.
            if (!appid) {
                return promiseUtils.resolve();
            }
            var appItem = new PortalItem({
                id: appid
            });
            return appItem.load().then(function (itemInfo) {
                return itemInfo.fetchData().then(function (data) {
                    var cfg = data && data.values || {};
                    var appProxies = itemInfo.appProxies;
                    // get the extent for the application item. This can be used to override the default web map extent
                    if (itemInfo.extent) {
                        cfg.application_extent = itemInfo.extent;
                    }
                    // get any app proxies defined on the application item
                    if (appProxies) {
                        var layerMixins = appProxies.map(function (p) {
                            return {
                                "url": p.sourceUrl,
                                "mixin": {
                                    "url": p.proxyUrl
                                }
                            };
                        });
                        cfg.layerMixins = layerMixins;
                    }
                    return {
                        data: itemInfo,
                        config: cfg
                    };
                }).otherwise(function (error) {
                    return {
                        error: error || new Error("Boilerplate:: Error retrieving application configuration data.")
                    };
                });
            }).otherwise(function (error) {
                return {
                    error: error || new Error("Boilerplate:: Error retrieving application configuration.")
                };
            });
        };
        Boilerplate.prototype._setupCORS = function (authorizedDomains) {
            var _this = this;
            if (this.settings.webTierSecurity && authorizedDomains && authorizedDomains.length) {
                authorizedDomains.forEach(function (authorizedDomain) {
                    if (_this._isDefined(authorizedDomain) && authorizedDomain.length) {
                        esriConfig.request.corsEnabledServers.push({
                            host: authorizedDomain,
                            withCredentials: true
                        });
                    }
                });
            }
        };
        Boilerplate.prototype._queryPortal = function () {
            var _this = this;
            if (!this.settings.portal.fetch) {
                return promiseUtils.resolve();
            }
            // Query the ArcGIS.com organization. This is defined by the portalUrl that is specified. For example if you
            // are a member of an org you'll want to set the portalUrl to be http://<your org name>.arcgis.com. We query
            // the organization by making a self request to the org url which returns details specific to that organization.
            // Examples of the type of information returned are custom roles, units settings, helper services and more.
            // If this fails, the application will continue to function
            var portal = new Portal();
            this.portal = portal;
            return portal.load().then(function (response) {
                _this._setupCORS(response.authorizedCrossOriginDomains);
                var user = response.user;
                var roleId = user && user.roleId;
                var userPrivileges = user && user.privileges;
                var userRegion = user && user.region;
                var userUnits = user && user.units;
                var responseUnits = response.units;
                var responseRegion = response.region;
                var ipCountryCode = response.ipCntryCode;
                var isEnglishUnits = (userRegion === "US") ||
                    (userRegion && responseRegion === "US") ||
                    (userRegion && !responseRegion) ||
                    (!user && ipCountryCode === "US") ||
                    (!user && !ipCountryCode && kernel.locale === "en-us");
                var units = userUnits ? userUnits : responseUnits ? responseUnits : isEnglishUnits ? "english" : "metric";
                _this.units = units;
                // are any custom roles defined in the organization?
                if (roleId && _this._isDefined(roleId) && userPrivileges) {
                    _this.userPrivileges = userPrivileges;
                }
                return { data: response };
            }).otherwise(function (error) {
                return {
                    error: error || new Error("Boilerplate:: Error retrieving organization information.")
                };
            });
        };
        Boilerplate.prototype._overwriteExtent = function (itemInfo, extent) {
            var item = itemInfo && itemInfo.item;
            if (item && item.extent) {
                item.extent = [
                    [
                        parseFloat(extent[0][0]), parseFloat(extent[0][1])
                    ],
                    [
                        parseFloat(extent[1][0]), parseFloat(extent[1][1])
                    ]
                ];
            }
        };
        Boilerplate.prototype._completeApplication = function () {
            // ArcGIS.com allows you to set an application extent on the application item. Overwrite the
            // existing extents with the application item extent when set.
            var applicationExtent = this.config.application_extent;
            var results = this.results;
            if (this.config.appid && applicationExtent && applicationExtent.length > 0) {
                this._overwriteExtent(results.webSceneItem.data, applicationExtent);
                this._overwriteExtent(results.webMapItem.data, applicationExtent);
            }
            // get helper services
            var configHelperServices = this.config.helperServices;
            var portalHelperServices = this.portal && this.portal.helperServices;
            // see if config has a geometry service
            var configGeometryUrl = configHelperServices && configHelperServices.geometry && configHelperServices.geometry.url;
            // seee if portal has a geometry service
            var portalGeometryUrl = portalHelperServices && portalHelperServices.geometry && portalHelperServices.geometry.url;
            // use the portal geometry service or config geometry service
            var geometryUrl = portalGeometryUrl || configGeometryUrl;
            if (geometryUrl) {
                // set the esri config to use the geometry service
                esriConfig.geometryServiceUrl = geometryUrl;
            }
            if ((!this.config.webmap || this.config.webmap === DEFAULT_URL_PARAM) && this.settings.defaultWebmap) {
                this.config.webmap = this.settings.defaultWebmap;
            }
            if ((!this.config.webscene || this.config.webscene === DEFAULT_URL_PARAM) && this.settings.defaultWebscene) {
                this.config.webscene = this.settings.defaultWebscene;
            }
            if ((!this.config.group || this.config.group === DEFAULT_URL_PARAM) && this.settings.defaultGroup) {
                this.config.group = this.settings.defaultGroup;
            }
        };
        Boilerplate.prototype._setLangProps = function () {
            var isRTL = RTL_LANGS.some(function (language) {
                return kernel.locale.indexOf(language) !== -1;
            });
            var direction = isRTL ? RTL : LTR;
            // set boilerplate language direction
            this.direction = direction;
            // set boilerplate langauge locale
            this.locale = kernel.locale;
        };
        Boilerplate.prototype._mixinAllConfigs = function () {
            var config = this.config;
            var applicationItem = this.results.applicationItem ? this.results.applicationItem.config : null;
            var localStorageConfig = this.results.localStorageConfig;
            var urlParams = this.results.urlParams ? this.results.urlParams : null;
            this.config = __assign({}, config, applicationItem, localStorageConfig, urlParams);
        };
        Boilerplate.prototype._initializeApplication = function () {
            if (this.settings.esriEnvironment) {
                var esriAppsPath = location.pathname.indexOf(ESRI_APPS_PATH);
                var esriHomePath = location.pathname.indexOf(ESRI_HOME_PATH);
                var isEsriAppsPath = esriAppsPath !== -1 ? true : false;
                var isEsriHomePath = esriHomePath !== -1 ? true : false;
                var appLocation = isEsriAppsPath ? esriAppsPath : isEsriHomePath ? esriHomePath : null;
                if (appLocation) {
                    var portalInstance = location.pathname.substr(0, appLocation);
                    this.config.portalUrl = "https://" + location.host + portalInstance;
                    this.config.proxyUrl = "https://" + location.host + portalInstance + ESRI_PROXY_PATH;
                }
            }
            esriConfig.portalUrl = this.config.portalUrl;
            if (this.config.proxyUrl) {
                esriConfig.request.proxyUrl = this.config.proxyUrl;
            }
        };
        Boilerplate.prototype._checkSignIn = function (oauthappid, portalUrl) {
            var SHARING_PATH = "/sharing";
            var info = oauthappid ?
                new OAuthInfo({
                    appId: oauthappid,
                    portalUrl: portalUrl,
                    popup: true
                }) : null;
            if (info) {
                IdentityManager.registerOAuthInfos([info]);
            }
            var signedIn = IdentityManager.checkSignInStatus(portalUrl + SHARING_PATH);
            return signedIn.always(promiseUtils.resolve);
        };
        Boilerplate.prototype._isDefined = function (value) {
            return (value !== undefined) && (value !== null);
        };
        return Boilerplate;
    }());
    exports.default = Boilerplate;
});
//# sourceMappingURL=boilerplate.js.map