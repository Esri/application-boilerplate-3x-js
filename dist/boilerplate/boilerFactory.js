var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
define(["require", "exports", "esri/config", "dojo/_base/kernel", "dojo/Deferred", "esri/core/promiseUtils", "esri/identity/IdentityManager", "esri/identity/OAuthInfo", "esri/portal/Portal", "esri/portal/PortalItem", "esri/portal/PortalQueryParams", "boilerplate/urlUtils"], function (require, exports, esriConfig, kernel, Deferred, promiseUtils, IdentityManager, OAuthInfo, Portal, PortalItem, PortalQueryParams, urlUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function boilerFactory(applicationConfig, boilerplateConfig) {
        //////////////////////////////////////////////////////////////////////
        //                  Initial Boilerplate Result                      //
        //////////////////////////////////////////////////////////////////////
        var settings = __assign({ environment: {}, group: {}, portal: {}, urlParams: [], webmap: {}, webscene: {} }, boilerplateConfig);
        var results = {
            urlParams: urlUtils_1.getUrlParamValues(settings.urlParams)
        };
        var config = generateInitialConfig();
        var portal = null;
        var units = null;
        var direction = getLanguageDirection();
        var locale = kernel.locale;
        //////////////////////////////////////////////////////////////////////
        //       Function Body (this is where customization happens)        //
        //////////////////////////////////////////////////////////////////////
        esriConfig.portalUrl = config.portalUrl;
        esriConfig.request.proxyUrl = config.proxyUrl;
        var resultPromise = new Deferred();
        handleAsyncProcessing(); // Triggers all asynchronous actions
        return resultPromise;
        //////////////////////////////////////////////////////////////////////
        //                            Public                                //
        //////////////////////////////////////////////////////////////////////
        function queryGroupItems(itemParams) {
            if (config.group && settings.group.fetchItems) {
                var paramOptions = __assign({ query: "group:\"" + config.group + "\" AND -type:\"Code Attachment\"", sortField: "modified", sortOrder: "desc", num: 9, start: 1 }, itemParams);
                return portal.queryItems(new PortalQueryParams(paramOptions));
            }
            return promiseUtils.resolve();
        }
        //////////////////////////////////////////////////////////////////////
        //                            Private                               //
        //////////////////////////////////////////////////////////////////////
        function handleAsyncProcessing() {
            resultPromise.progress({ status: "Checking user login.." });
            checkSignIn(config.oauthappid, config.portalUrl)
                .always(function () {
                resultPromise.progress({ status: "Querying portal & application.." });
                return promiseUtils.eachAlways([queryApp(), queryPortal()]);
            })
                .then(function (_a) {
                var applicationResponse = _a[0], portalResponse = _a[1];
                resultPromise.progress({ status: "Querying group data.." });
                processAppResponse(applicationResponse);
                processPortalResponse(portalResponse);
                return promiseUtils.eachAlways([
                    queryWebMapItem(),
                    queryWebSceneItem(),
                    queryGroupInfo(),
                    queryGroupItems(settings.group.itemParams)
                ]);
            }, handleErr)
                .then(function (queryResponse) {
                resultPromise.progress({ status: "Processing group response.." });
                processWebGroupResponse(queryResponse);
                resultPromise.resolve({
                    settings: settings,
                    results: results,
                    config: config,
                    direction: direction,
                    portal: portal,
                    units: units,
                    locale: locale,
                    queryGroupItems: queryGroupItems
                });
            }, handleErr);
        }
        function handleErr(err) {
            resultPromise.reject(err);
        }
        function generateInitialConfig() {
            var newConfig = __assign({}, applicationConfig, results.urlParams);
            newConfig.group = getDefaultId(newConfig.group, settings.group.default);
            newConfig.webmap = getDefaultId(newConfig.webmap, settings.webmap.default);
            newConfig.webscene = getDefaultId(newConfig.webscene, settings.webscene.default);
            if (settings.environment.isEsri) {
                var esriPortalUrl = getEsriEnvironmentPortalUrl();
                newConfig.portalUrl = esriPortalUrl;
                newConfig.proxyUrl = esriPortalUrl + "/sharing/proxy";
            }
            return newConfig;
            function getEsriEnvironmentPortalUrl() {
                var esriAppsPathIndex = location.pathname.indexOf("/apps/");
                var esriHomePathIndex = location.pathname.indexOf("/home");
                var isEsriAppsPath = esriAppsPathIndex !== -1 ? true : false;
                var isEsriHomePath = esriHomePathIndex !== -1 ? true : false;
                var appLocationIndex = isEsriAppsPath ? esriAppsPathIndex : (isEsriHomePath ? esriHomePathIndex : null);
                if (!appLocationIndex) {
                    return null;
                }
                var portalInstance = location.pathname.substr(0, appLocationIndex);
                var host = location.host;
                return "https://" + host + portalInstance;
            }
            function getDefaultId(id, defaultId) {
                var useDefaultId = (!id || id === "default") && defaultId;
                if (useDefaultId) {
                    return defaultId;
                }
                return id;
            }
        }
        function getLanguageDirection() {
            var RTLLangs = ["ar", "he"];
            var isRTL = RTLLangs.some(function (language) {
                return kernel.locale.indexOf(language) !== -1;
            });
            return isRTL ? "rtl" : "ltr";
        }
        function checkSignIn(appId, portalUrl) {
            var info = appId ?
                new OAuthInfo({
                    appId: appId,
                    portalUrl: portalUrl,
                    popup: true
                }) : null;
            if (info) {
                IdentityManager.registerOAuthInfos([info]);
            }
            return IdentityManager.checkSignInStatus(portalUrl + "/sharing");
        }
        function queryApp() {
            if (config.appid) {
                var appItem = new PortalItem({
                    id: config.appid
                });
                return appItem.load()
                    .then(function (itemInfo) { return (itemInfo.fetchData()
                    .then(function (itemData) { return ({ itemInfo: itemInfo, itemData: itemData }); }, handleErr)); }, handleErr);
            }
            return promiseUtils.resolve();
        }
        function queryPortal() {
            if (settings.portal.fetch) {
                return new Portal().load();
            }
            return promiseUtils.resolve();
        }
        function processAppResponse(applicationResponse) {
            var localStorage = settings.localStorage.fetch ?
                getLocalConfig(config.appid) :
                null;
            results.localStorage = localStorage;
            results.application = applicationResponse;
            var applicationValues = applicationResponse.value ? applicationResponse.value.itemData.values : null;
            config = __assign({}, config, localStorage, applicationValues);
        }
        function processPortalResponse(portalResponse) {
            portal = portalResponse.value;
            units = getUnits();
            setupCORS(portal.authorizedCrossOriginDomains, settings.environment.webTierSecurity);
        }
        function queryWebMapItem() {
            if (config.webmap && settings.webmap.fetch) {
                return new PortalItem({ id: config.webmap }).load();
            }
            return promiseUtils.resolve();
        }
        function queryWebSceneItem() {
            if (config.webscene && settings.webscene.fetch) {
                return new PortalItem({ id: config.webscene }).load();
            }
            return promiseUtils.resolve();
        }
        function queryGroupInfo() {
            if (config.group && settings.group.fetchInfo) {
                var params = new PortalQueryParams({
                    query: "id:\"" + config.group + "\""
                });
                return portal.queryGroups(params);
            }
            return promiseUtils.resolve();
        }
        function processWebGroupResponse(_a) {
            var webMapResponse = _a[0], webSceneResponse = _a[1], groupInfoResponse = _a[2], groupItemsResponse = _a[3];
            results = __assign({}, results, { groupInfo: groupInfoResponse, groupItems: groupItemsResponse, webMapItem: webMapResponse, webSceneItem: webSceneResponse });
            overwriteItemExtent(webMapResponse.value);
            overwriteItemExtent(webSceneResponse.value);
            setGeometryService();
        }
        function getLocalConfig(appid) {
            if (!(window.localStorage && appid)) {
                return;
            }
            var localStoragePrefix = "boilerplate_config_";
            var lsItem = localStorage.getItem(localStoragePrefix + appid);
            var localConfig = lsItem && JSON.parse(lsItem);
            return localConfig;
        }
        function setupCORS(authorizedDomains, webTierSecurity) {
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
        }
        function getUnits() {
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
            return userUnits ? userUnits : responseUnits ? responseUnits : isEnglishUnits ? "english" : "metric";
        }
        function overwriteItemExtent(item) {
            var applicationItem = results.application.value;
            if (!applicationItem || !item) {
                return;
            }
            var applicationExtent = applicationItem.extent;
            item.extent = applicationExtent ? applicationExtent : item.extent;
        }
        function setGeometryService() {
            var userPortal = portal;
            var configHelperServices = config.helperServices;
            var portalHelperServices = userPortal && userPortal.helperServices;
            var configGeometryUrl = configHelperServices && configHelperServices.geometry && configHelperServices.geometry.url;
            var portalGeometryUrl = portalHelperServices && portalHelperServices.geometry && portalHelperServices.geometry.url;
            var geometryUrl = portalGeometryUrl || configGeometryUrl;
            if (!geometryUrl) {
                return;
            }
            esriConfig.geometryServiceUrl = geometryUrl;
        }
    }
    exports.default = boilerFactory;
});
//# sourceMappingURL=boilerFactory.js.map