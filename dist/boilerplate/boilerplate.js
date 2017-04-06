var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
define(["require", "exports", "dojo/_base/kernel", "esri/config", "esri/core/promiseUtils", "esri/identity/IdentityManager", "esri/identity/OAuthInfo", "esri/portal/Portal", "esri/portal/PortalItem", "esri/portal/PortalQueryParams", "boilerplate/UrlParamHelper"], function (require, exports, kernel, esriConfig, promiseUtils, IdentityManager, OAuthInfo, Portal, PortalItem, PortalQueryParams, UrlParamHelper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function isDefined(value) {
        return (value !== undefined) && (value !== null);
    }
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
            this.locale = kernel.locale;
            this.units = null;
            this.settings = __assign({}, boilerplateConfigJSON);
            this.config = applicationConfigJSON;
        }
        Boilerplate.prototype.queryGroupItems = function (groupId, itemParams, portal) {
            var paramOptions = __assign({ query: "group:\"" + groupId + "\" AND -type:\"Code Attachment\"", sortField: "modified", sortOrder: "desc", num: 9, start: 1 }, itemParams);
            var params = new PortalQueryParams(paramOptions);
            return portal.queryItems(params);
        };
        // todo: cleanup
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
            var urlParams = UrlParamHelper_1.getUrlParamValues(this.settings.urlItems);
            this.results.urlParams = urlParams;
            this.config = this._mixinAllConfigs({
                config: this.config,
                url: urlParams
            });
            if (this.settings.esriEnvironment) {
                var esriPortalUrl = this._getEsriEnvironmentPortalUrl();
                this.config.portalUrl = esriPortalUrl;
                this.config.proxyUrl = this._getEsriEnvironmentProxyUrl(esriPortalUrl);
            }
            this._setPortalUrl(this.config.portalUrl);
            this._setProxyUrl(this.config.proxyUrl);
            this.direction = this._getLanguageDirection();
            var checkSignIn = this._checkSignIn(this.config.oauthappid, this.config.portalUrl);
            return checkSignIn.always(function () {
                var appId = _this.config.appid;
                var queryApplicationItem = appId ?
                    _this._queryApplicationItem(appId) :
                    promiseUtils.resolve();
                var queryPortal = _this.settings.portal.fetch ?
                    _this._queryPortal() :
                    promiseUtils.resolve();
                return promiseUtils.eachAlways([
                    queryApplicationItem,
                    queryPortal
                ]).always(function (applicationArgs) {
                    var applicationResponse = applicationArgs[0], portalResponse = applicationArgs[1];
                    var localConfig = _this.settings.localConfig.fetch ?
                        _this._getLocalConfig(appId) :
                        null;
                    _this.results.localStorageConfig = localConfig;
                    var applicationItem = applicationResponse.value;
                    var applicationConfig = applicationItem ? applicationItem.data.values : null;
                    _this.results.applicationItem = applicationItem;
                    var portal = portalResponse.value;
                    _this.portal = portal;
                    _this._setupCORS(portal.authorizedCrossOriginDomains, _this.settings.webTierSecurity);
                    _this.units = _this._getUnits(portal);
                    _this.config = _this._mixinAllConfigs({
                        config: _this.config,
                        url: urlParams,
                        local: localConfig,
                        application: applicationConfig
                    });
                    var webMapId = _this.config.webmap;
                    var queryWebMapItem = webMapId && _this.settings.webmap.fetch ?
                        _this._queryWebMapItem(webMapId) :
                        promiseUtils.resolve();
                    var webSceneId = _this.config.webscene;
                    var queryWebSceneItem = webSceneId && _this.settings.webscene.fetch ?
                        _this._queryWebSceneItem(webSceneId) :
                        promiseUtils.resolve();
                    var groupId = _this.config.group;
                    var queryGroupInfo = _this.settings.group.fetchInfo && groupId ?
                        _this._queryGroupInfo(groupId, portal) :
                        promiseUtils.resolve();
                    var queryGroupItems = _this.settings.group.fetchItems || groupId ?
                        _this.queryGroupItems(groupId, _this.settings.group.itemParams, portal) :
                        promiseUtils.resolve();
                    return promiseUtils.eachAlways([
                        queryWebMapItem,
                        queryWebSceneItem,
                        queryGroupInfo,
                        queryGroupItems
                    ]).always(function (itemArgs) {
                        var webMapResponse = itemArgs[0], webSceneResponse = itemArgs[1], groupInfoResponse = itemArgs[2], groupItemsResponse = itemArgs[3];
                        var webSceneItem = webSceneResponse.value || webSceneResponse.error;
                        var webMapItem = webMapResponse.value || webMapResponse.error;
                        _this.results.webMapItem = webMapItem;
                        _this.results.webSceneItem = webSceneItem;
                        _this.results.group.itemsData = groupItemsResponse.value || groupItemsResponse.error;
                        _this.results.group.infoData = groupInfoResponse.value || groupInfoResponse.error;
                        _this._overwriteItemExtent(webSceneItem, applicationItem.item);
                        _this._overwriteItemExtent(webMapItem, applicationItem.item);
                        _this._setGeometryService(_this.config, _this.portal);
                        _this.config.webmap = _this._getDefaultId(_this.config.webmap, _this.settings.defaultWebmap);
                        _this.config.webscene = _this._getDefaultId(_this.config.webscene, _this.settings.defaultWebscene);
                        _this.config.group = _this._getDefaultId(_this.config.group, _this.settings.defaultGroup);
                        // todo: do we need these on the class or just returned?
                        return {
                            settings: _this.settings,
                            config: _this.config,
                            results: _this.results,
                            portal: _this.portal,
                            direction: _this.direction,
                            locale: _this.locale,
                            units: _this.units
                        };
                    });
                });
            });
        };
        Boilerplate.prototype._getUnits = function (portal) {
            var user = portal.user;
            var userRegion = user && user.region;
            var userUnits = user && user.units;
            var responseUnits = portal.units;
            var responseRegion = portal.region;
            var ipCountryCode = portal.ipCntryCode;
            var isEnglishUnits = (userRegion === "US") ||
                (userRegion && responseRegion === "US") ||
                (userRegion && !responseRegion) ||
                (!user && ipCountryCode === "US") ||
                (!user && !ipCountryCode && kernel.locale === "en-us");
            var units = userUnits ? userUnits : responseUnits ? responseUnits : isEnglishUnits ? "english" : "metric";
            return units;
        };
        Boilerplate.prototype._getLocalConfig = function (appid) {
            if (!(window.localStorage && appid)) {
                return;
            }
            var localStoragePrefix = "boilerplate_config_";
            var lsItem = localStorage.getItem(localStoragePrefix + appid);
            var localConfig = lsItem && JSON.parse(lsItem);
            return localConfig;
        };
        Boilerplate.prototype._queryWebMapItem = function (webMapId) {
            var mapItem = new PortalItem({
                id: webMapId
            });
            return mapItem.load();
        };
        Boilerplate.prototype._queryGroupInfo = function (groupId, portal) {
            var params = new PortalQueryParams({
                query: "id:\"" + groupId + "\""
            });
            return portal.queryGroups(params);
        };
        Boilerplate.prototype._queryWebSceneItem = function (webSceneId) {
            var sceneItem = new PortalItem({
                id: webSceneId
            });
            return sceneItem.load();
        };
        // todo: need to figure out the  layermixins
        Boilerplate.prototype._queryApplicationItem = function (appid) {
            var appItem = new PortalItem({
                id: appid
            });
            return appItem.load().then(function (itemInfo) {
                return itemInfo.fetchData().then(function (itemData) {
                    // const cfg = itemData && itemData.values || {};
                    // const appProxies = itemInfo.appProxies;
                    // get any app proxies defined on the application item
                    // if (appProxies) {
                    //   const layerMixins = appProxies.map((p) => {
                    //     return {
                    //       "url": p.sourceUrl,
                    //       "mixin": {
                    //         "url": p.proxyUrl
                    //       }
                    //     };
                    //   });
                    //   cfg.layerMixins = layerMixins;
                    // }
                    return {
                        item: itemInfo,
                        data: itemData
                    };
                });
            });
        };
        Boilerplate.prototype._setupCORS = function (authorizedDomains, webTierSecurity) {
            if (webTierSecurity && authorizedDomains && authorizedDomains.length) {
                authorizedDomains.forEach(function (authorizedDomain) {
                    if (isDefined(authorizedDomain) && authorizedDomain.length) {
                        esriConfig.request.corsEnabledServers.push({
                            host: authorizedDomain,
                            withCredentials: true
                        });
                    }
                });
            }
        };
        Boilerplate.prototype._queryPortal = function () {
            return new Portal().load();
        };
        Boilerplate.prototype._overwriteItemExtent = function (item, applicationItem) {
            if (applicationItem instanceof Error || item instanceof Error || !applicationItem || !item) {
                return;
            }
            var applicationExtent = applicationItem.extent;
            item.extent = applicationExtent ? applicationExtent : item.extent;
        };
        Boilerplate.prototype._setGeometryService = function (config, portal) {
            // get helper services
            var configHelperServices = config.helperServices;
            var portalHelperServices = portal && portal.helperServices;
            // see if config has a geometry service
            var configGeometryUrl = configHelperServices && configHelperServices.geometry && configHelperServices.geometry.url;
            // seee if portal has a geometry service
            var portalGeometryUrl = portalHelperServices && portalHelperServices.geometry && portalHelperServices.geometry.url;
            // use the portal geometry service or config geometry service
            var geometryUrl = portalGeometryUrl || configGeometryUrl;
            if (!geometryUrl) {
                return;
            }
            // set the esri config to use the geometry service
            esriConfig.geometryServiceUrl = geometryUrl;
        };
        Boilerplate.prototype._getDefaultId = function (id, defaultId) {
            var defaultUrlParam = "default";
            var useDefaultId = (!id || id === defaultUrlParam) && defaultId;
            if (useDefaultId) {
                return defaultId;
            }
            return id;
        };
        Boilerplate.prototype._getLanguageDirection = function () {
            var LTR = "ltr";
            var RTL = "rtl";
            var RTLLangs = ["ar", "he"];
            var isRTL = RTLLangs.some(function (language) {
                return kernel.locale.indexOf(language) !== -1;
            });
            return isRTL ? RTL : LTR;
        };
        Boilerplate.prototype._mixinAllConfigs = function (params) {
            var config = params.config || null;
            var appConfig = params.application || null;
            var localConfig = params.local || null;
            var urlConfig = params.url || null;
            return __assign({}, config, appConfig, localConfig, urlConfig);
        };
        Boilerplate.prototype._setPortalUrl = function (portalUrl) {
            esriConfig.portalUrl = portalUrl;
        };
        Boilerplate.prototype._setProxyUrl = function (proxyUrl) {
            esriConfig.request.proxyUrl = proxyUrl;
        };
        Boilerplate.prototype._getEsriEnvironmentPortalUrl = function () {
            var esriAppsPath = "/apps/";
            var esriHomePath = "/home/";
            var esriAppsPathIndex = location.pathname.indexOf(esriAppsPath);
            var esriHomePathIndex = location.pathname.indexOf(esriHomePath);
            var isEsriAppsPath = esriAppsPathIndex !== -1 ? true : false;
            var isEsriHomePath = esriHomePathIndex !== -1 ? true : false;
            var appLocationIndex = isEsriAppsPath ? esriAppsPathIndex : isEsriHomePath ? esriHomePathIndex : null;
            if (!appLocationIndex) {
                return;
            }
            var portalInstance = location.pathname.substr(0, appLocationIndex);
            var host = location.host;
            return "https://" + host + portalInstance;
        };
        Boilerplate.prototype._getEsriEnvironmentProxyUrl = function (portalUrl) {
            var esriProxyPath = "/sharing/proxy";
            return "" + portalUrl + esriProxyPath;
        };
        Boilerplate.prototype._checkSignIn = function (oauthappid, portalUrl) {
            var sharingPath = "/sharing";
            var info = oauthappid ?
                new OAuthInfo({
                    appId: oauthappid,
                    portalUrl: portalUrl,
                    popup: true
                }) : null;
            if (info) {
                IdentityManager.registerOAuthInfos([info]);
            }
            var signedIn = IdentityManager.checkSignInStatus(portalUrl + sharingPath);
            return signedIn.always(promiseUtils.resolve);
        };
        return Boilerplate;
    }());
    exports.default = Boilerplate;
});
//# sourceMappingURL=boilerplate.js.map