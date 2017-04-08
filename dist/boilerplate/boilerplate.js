var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
define(["require", "exports", "dojo/_base/kernel", "esri/config", "esri/core/promiseUtils", "esri/identity/IdentityManager", "esri/identity/OAuthInfo", "esri/portal/Portal", "esri/portal/PortalItem", "esri/portal/PortalQueryParams", "boilerplate/urlUtils"], function (require, exports, kernel, esriConfig, promiseUtils, IdentityManager, OAuthInfo, Portal, PortalItem, PortalQueryParams, urlUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Boilerplate = (function () {
        //--------------------------------------------------------------------------
        //
        //  Lifecycle
        //
        //--------------------------------------------------------------------------
        function Boilerplate(applicationConfigJSON, boilerplateConfigJSON) {
            //--------------------------------------------------------------------------
            //
            //  Properties
            //
            //--------------------------------------------------------------------------
            this.settings = {
                environment: {},
                webscene: {},
                webmap: {},
                group: {},
                portal: {},
                urlParams: []
            };
            this.config = null;
            this.results = {};
            this.portal = null;
            this.direction = null;
            this.locale = kernel.locale;
            this.units = null;
            this.settings = __assign({}, boilerplateConfigJSON);
            this.config = applicationConfigJSON;
        }
        //--------------------------------------------------------------------------
        //
        //  Public Methods
        //
        //--------------------------------------------------------------------------
        Boilerplate.prototype.queryGroupItems = function (groupId, itemParams, portal) {
            var paramOptions = __assign({ query: "group:\"" + groupId + "\" AND -type:\"Code Attachment\"", sortField: "modified", sortOrder: "desc", num: 9, start: 1 }, itemParams);
            var params = new PortalQueryParams(paramOptions);
            return portal.queryItems(params);
        };
        Boilerplate.prototype.load = function () {
            var _this = this;
            var urlParams = urlUtils_1.getUrlParamValues(this.settings.urlParams);
            this.results.urlParams = urlParams;
            this.config = this._mixinAllConfigs({
                config: this.config,
                url: urlParams
            });
            if (this.settings.environment.isEsri) {
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
                    _this._queryApplication(appId) :
                    promiseUtils.resolve();
                var queryPortal = _this.settings.portal.fetch ?
                    _this._queryPortal() :
                    promiseUtils.resolve();
                return promiseUtils.eachAlways([
                    queryApplicationItem,
                    queryPortal
                ]).always(function (applicationArgs) {
                    var applicationResponse = applicationArgs[0], portalResponse = applicationArgs[1];
                    var localStorage = _this.settings.localStorage.fetch ?
                        _this._getLocalConfig(appId) :
                        null;
                    _this.results.localStorage = localStorage;
                    var applicationItem = applicationResponse.value;
                    var applicationItemData = applicationItem.itemData;
                    var applicationConfig = applicationItem ? applicationItemData.values : null;
                    var applicationInfo = applicationItem ? applicationItem.itemInfo : null;
                    _this.results.application = applicationResponse;
                    var portal = portalResponse.value;
                    _this.portal = portal;
                    _this._setupCORS(portal.authorizedCrossOriginDomains, _this.settings.environment.webTierSecurity);
                    _this.units = _this._getUnits(portal);
                    _this.config = _this._mixinAllConfigs({
                        config: _this.config,
                        url: urlParams,
                        local: localStorage,
                        application: applicationConfig
                    });
                    var webMapId = _this.config.webmap;
                    var queryWebMapItem = webMapId && _this.settings.webmap.fetch ?
                        _this._queryItem(webMapId) :
                        promiseUtils.resolve();
                    var webSceneId = _this.config.webscene;
                    var queryWebSceneItem = webSceneId && _this.settings.webscene.fetch ?
                        _this._queryItem(webSceneId) :
                        promiseUtils.resolve();
                    var groupId = _this.config.group;
                    var queryGroupInfo = _this.settings.group.fetchInfo && groupId ?
                        _this._queryGroupInfo(groupId, portal) :
                        promiseUtils.resolve();
                    var queryGroupItems = _this.settings.group.fetchItems && groupId ?
                        _this.queryGroupItems(groupId, _this.settings.group.itemParams, portal) :
                        promiseUtils.resolve();
                    return promiseUtils.eachAlways([
                        queryWebMapItem,
                        queryWebSceneItem,
                        queryGroupInfo,
                        queryGroupItems
                    ]).always(function (itemArgs) {
                        var webMapResponse = itemArgs[0], webSceneResponse = itemArgs[1], groupInfoResponse = itemArgs[2], groupItemsResponse = itemArgs[3];
                        var webSceneItem = webSceneResponse.value;
                        var webMapItem = webMapResponse.value;
                        // todo: mixin sourceUrl with proxyUrl
                        // const appProxies = applicationInfo.appProxies;
                        _this.results.webMapItem = webMapResponse;
                        _this.results.webSceneItem = webSceneResponse;
                        _this.results.groupItems = groupItemsResponse;
                        _this.results.groupInfo = groupInfoResponse;
                        _this._overwriteItemExtent(webSceneItem, applicationItem.itemInfo);
                        _this._overwriteItemExtent(webMapItem, applicationItem.itemInfo);
                        _this._setGeometryService(_this.config, _this.portal);
                        _this.config.webmap = _this._getDefaultId(_this.config.webmap, _this.settings.webmap.default);
                        _this.config.webscene = _this._getDefaultId(_this.config.webscene, _this.settings.webscene.default);
                        _this.config.group = _this._getDefaultId(_this.config.group, _this.settings.group.default);
                        return _this;
                    });
                });
            });
        };
        //--------------------------------------------------------------------------
        //
        //  Private Methods
        //
        //--------------------------------------------------------------------------
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
        Boilerplate.prototype._queryItem = function (id) {
            var item = new PortalItem({
                id: id
            });
            return item.load();
        };
        Boilerplate.prototype._queryGroupInfo = function (groupId, portal) {
            var params = new PortalQueryParams({
                query: "id:\"" + groupId + "\""
            });
            return portal.queryGroups(params);
        };
        Boilerplate.prototype._queryApplication = function (appid) {
            var appItem = new PortalItem({
                id: appid
            });
            return appItem.load().then(function (itemInfo) {
                return itemInfo.fetchData().then(function (itemData) {
                    return {
                        itemInfo: itemInfo,
                        itemData: itemData
                    };
                });
            });
        };
        Boilerplate.prototype._setupCORS = function (authorizedDomains, webTierSecurity) {
            if (!webTierSecurity || !authorizedDomains || !authorizedDomains.length) {
                return;
            }
            authorizedDomains.forEach(function (authorizedDomain) {
                var isDefined = (authorizedDomain !== undefined) && (authorizedDomain !== null);
                if (isDefined && authorizedDomain.length) {
                    esriConfig.request.corsEnabledServers.push({
                        host: authorizedDomain,
                        withCredentials: true
                    });
                }
            });
        };
        Boilerplate.prototype._queryPortal = function () {
            return new Portal().load();
        };
        Boilerplate.prototype._overwriteItemExtent = function (item, applicationItem) {
            if (!applicationItem || !item) {
                return;
            }
            var applicationExtent = applicationItem.extent;
            item.extent = applicationExtent ? applicationExtent : item.extent;
        };
        Boilerplate.prototype._setGeometryService = function (config, ptl) {
            var portal = ptl; // todo: fix next api release
            var configHelperServices = config.helperServices;
            var portalHelperServices = portal && portal.helperServices;
            var configGeometryUrl = configHelperServices && configHelperServices.geometry && configHelperServices.geometry.url;
            var portalGeometryUrl = portalHelperServices && portalHelperServices.geometry && portalHelperServices.geometry.url;
            var geometryUrl = portalGeometryUrl || configGeometryUrl;
            if (!geometryUrl) {
                return;
            }
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
//# sourceMappingURL=Boilerplate.js.map