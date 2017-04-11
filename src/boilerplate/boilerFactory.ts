import esriConfig = require("esri/config");

import * as kernel from "dojo/_base/kernel";
import * as Deferred from "dojo/Deferred";
import * as promiseUtils from "esri/core/promiseUtils";
import * as IdentityManager from "esri/identity/IdentityManager";
import * as OAuthInfo from "esri/identity/OAuthInfo";
import * as Portal from "esri/portal/Portal";
import * as PortalItem from "esri/portal/PortalItem";
import * as PortalQueryParams from "esri/portal/PortalQueryParams";

import { getUrlParamValues } from "boilerplate/urlUtils";

import {
  ApplicationConfig,
  BoilerplateApplicationResult,
  BoilerplateResults,
  BoilerplateSettings
} from "boilerplate/interfaces";

export interface IBoilerplateResult {
    settings: BoilerplateSettings;
    results: BoilerplateResults;
    config: ApplicationConfig;
    portal: Portal;
    units: string;
    direction: Direction;
    locale: any;
    queryGroupItems: any;
}

type Direction = "ltr" | "rtl";

export default function boilerFactory(applicationConfig, boilerplateConfig): dojo.Deferred<IBoilerplateResult> {

    //////////////////////////////////////////////////////////////////////
    //                  Initial Boilerplate Result                      //
    //////////////////////////////////////////////////////////////////////

    let settings: BoilerplateSettings = {
        environment: {},
        group: {},
        portal: {},
        urlParams: [],
        webmap: {},
        webscene: {},
        ...boilerplateConfig
    };

    let results: BoilerplateResults = {
        urlParams: getUrlParamValues(settings.urlParams)
    };

    let config: ApplicationConfig = generateInitialConfig();
    let portal: Portal = null;
    let units: string = null;
    const direction: Direction = getLanguageDirection();
    const locale = kernel.locale;

    //////////////////////////////////////////////////////////////////////
    //       Function Body (this is where customization happens)        //
    //////////////////////////////////////////////////////////////////////

    esriConfig.portalUrl = config.portalUrl;
    esriConfig.request.proxyUrl = config.proxyUrl;

    const resultPromise = new Deferred();
    handleAsyncProcessing(); // Triggers all asynchronous actions
    return resultPromise;

    //////////////////////////////////////////////////////////////////////
    //                            Public                                //
    //////////////////////////////////////////////////////////////////////

    function queryGroupItems(itemParams): IPromise<any> {
        if (config.group && settings.group.fetchItems) {
            const paramOptions = {
                query: `group:"${config.group}" AND -type:"Code Attachment"`,
                sortField: "modified",
                sortOrder: "desc",
                num: 9,
                start: 1,
                ...itemParams
            };
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
            .always(() => {
                resultPromise.progress({ status: "Querying portal & application.." });
                return promiseUtils.eachAlways([queryApp(), queryPortal()]);
            })
            .then(([applicationResponse, portalResponse]) => {
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
            .then((queryResponse) => {
                resultPromise.progress({ status: "Processing group response.." });
                processWebGroupResponse(queryResponse);
                resultPromise.resolve({                    // This is where the processed response is generated for export
                    settings,
                    results,
                    config,
                    direction,
                    portal,
                    units,
                    locale,
                    queryGroupItems
                });
            }, handleErr);
    }

    function handleErr(err) {
        resultPromise.reject(err);
    }

    function generateInitialConfig() {
        const newConfig = {
            ...applicationConfig,
            ...results.urlParams,
        };
        newConfig.group = getDefaultId(newConfig.group, settings.group.default);
        newConfig.webmap = getDefaultId(newConfig.webmap, settings.webmap.default);
        newConfig.webscene = getDefaultId(newConfig.webscene, settings.webscene.default);

        if (settings.environment.isEsri) {
            const esriPortalUrl = getEsriEnvironmentPortalUrl();
            newConfig.portalUrl = esriPortalUrl;
            newConfig.proxyUrl = `${esriPortalUrl}/sharing/proxy`;
        }

        return newConfig;

        function getEsriEnvironmentPortalUrl(): string {
            const esriAppsPathIndex = location.pathname.indexOf("/apps/");
            const esriHomePathIndex = location.pathname.indexOf("/home");
            const isEsriAppsPath = esriAppsPathIndex !== -1 ? true : false;
            const isEsriHomePath = esriHomePathIndex !== -1 ? true : false;
            const appLocationIndex = isEsriAppsPath ? esriAppsPathIndex : (isEsriHomePath ? esriHomePathIndex : null);

            if (!appLocationIndex) {
                return null;
            }

            const portalInstance = location.pathname.substr(0, appLocationIndex);
            const host = location.host;
            return `https://${host}${portalInstance}`;
        }

        function getDefaultId(id: string, defaultId: string): string {
            const useDefaultId = (!id || id === "default") && defaultId;
            if (useDefaultId) {
                return defaultId;
            }
            return id;
        }
    }

    function getLanguageDirection(): Direction {
        const RTLLangs = ["ar", "he"];
        const isRTL = RTLLangs.some((language) => {
            return kernel.locale.indexOf(language) !== -1;
        });
        return isRTL ? "rtl" : "ltr";
    }

    function checkSignIn(appId: string, portalUrl: string): IPromise<void> {
        const info = appId ?
        new OAuthInfo({
            appId,
            portalUrl,
            popup: true
        }) : null;

        if (info) {
            IdentityManager.registerOAuthInfos([info]);
        }

        return IdentityManager.checkSignInStatus(`${portalUrl}/sharing`);
    }

    function queryApp(): IPromise<BoilerplateApplicationResult> {
        if (config.appid) {
            const appItem = new PortalItem({
                id: config.appid
            });
            return appItem.load()
                .then((itemInfo) => (
                    itemInfo.fetchData()
                        .then((itemData) => (
                            { itemInfo, itemData}
                        ), handleErr)
                ), handleErr);
        }
        return promiseUtils.resolve();
    }

    function queryPortal(): IPromise<Portal> {
        if (settings.portal.fetch) {
            return new Portal().load();
        }
        return promiseUtils.resolve();
    }

    function processAppResponse(applicationResponse): void {
        const localStorage = settings.localStorage.fetch ?
          getLocalConfig(config.appid) :
          null;
        results.localStorage = localStorage;
        results.application = applicationResponse;
        const applicationValues = applicationResponse.value ? applicationResponse.value.itemData.values : null;
        config = {
            ...config,
            ...localStorage,
            ...applicationValues
        };
    }

    function processPortalResponse(portalResponse): void {
        portal = portalResponse.value;
        units = getUnits();
        setupCORS(portal.authorizedCrossOriginDomains, settings.environment.webTierSecurity);
    }

    function queryWebMapItem(): IPromise<PortalItem> {
        if (config.webmap && settings.webmap.fetch) {
            return new PortalItem({ id: config.webmap }).load();
        }
        return promiseUtils.resolve();
    }

    function queryWebSceneItem(): IPromise<PortalItem> {
        if (config.webscene && settings.webscene.fetch) {
            return new PortalItem({ id: config.webscene }).load();
        }
        return promiseUtils.resolve();
    }

    function queryGroupInfo(): IPromise<any> {
        if (config.group && settings.group.fetchInfo) {
            const params = new PortalQueryParams({
                query: `id:"${config.group}"`
            });
            return portal.queryGroups(params);
        }
        return promiseUtils.resolve();
    }

    function processWebGroupResponse([webMapResponse, webSceneResponse, groupInfoResponse, groupItemsResponse]) {
        results = {
            ...results,
            groupInfo: groupInfoResponse,
            groupItems: groupItemsResponse,
            webMapItem: webMapResponse,
            webSceneItem: webSceneResponse,
        };

        overwriteItemExtent(webMapResponse.value);
        overwriteItemExtent(webSceneResponse.value);
        setGeometryService();
    }

    function getLocalConfig(appid: string): ApplicationConfig {
        if (!(window.localStorage && appid)) {
            return;
        }

        const localStoragePrefix = "boilerplate_config_";
        const lsItem = localStorage.getItem(localStoragePrefix + appid);
        const localConfig = lsItem && JSON.parse(lsItem);
        return localConfig;
    }

    function setupCORS(authorizedDomains: any, webTierSecurity: boolean): void {
        if (!webTierSecurity || !authorizedDomains || !authorizedDomains.length) {
            return;
        }

        authorizedDomains.forEach((authorizedDomain) => {
            const isDefined = (authorizedDomain !== undefined) && (authorizedDomain !== null);
            if (isDefined && authorizedDomain.length) {
                esriConfig.request.corsEnabledServers.push({
                    host: authorizedDomain,
                    withCredentials: true
                });
            }
        });
    }

    function getUnits(): string {
        const user = portal.user;
        const userRegion = user && user.region;
        const userUnits = user && user.units;
        const responseUnits = portal.units;
        const responseRegion = portal.region;
        const ipCountryCode = portal.ipCntryCode;
        const isEnglishUnits = (userRegion === "US") ||
        (userRegion && responseRegion === "US") ||
        (userRegion && !responseRegion) ||
        (!user && ipCountryCode === "US") ||
        (!user && !ipCountryCode && kernel.locale === "en-us");
        return userUnits ? userUnits : responseUnits ? responseUnits : isEnglishUnits ? "english" : "metric";
    }

    function overwriteItemExtent(item: PortalItem): void {
        const applicationItem = results.application.value;
        if (!applicationItem || !item) {
            return;
        }

        const applicationExtent = applicationItem.extent;

        item.extent = applicationExtent ? applicationExtent : item.extent;
    }

    function setGeometryService() { // todo: fix next api release
        const userPortal = portal as any;
        const configHelperServices = config.helperServices;
        const portalHelperServices = userPortal && userPortal.helperServices;
        const configGeometryUrl = configHelperServices && configHelperServices.geometry && configHelperServices.geometry.url;
        const portalGeometryUrl = portalHelperServices && portalHelperServices.geometry && portalHelperServices.geometry.url;
        const geometryUrl = portalGeometryUrl || configGeometryUrl;
        if (!geometryUrl) {
            return;
        }
        esriConfig.geometryServiceUrl = geometryUrl;
    }
}
