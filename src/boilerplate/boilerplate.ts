import kernel = require("dojo/_base/kernel");

import esriConfig = require("esri/config");

import Extent = require("esri/geometry/Extent");

import promiseUtils = require("esri/core/promiseUtils");

import IdentityManager = require("esri/identity/IdentityManager");
import OAuthInfo = require("esri/identity/OAuthInfo");

import Portal = require("esri/portal/Portal");
import PortalItem = require("esri/portal/PortalItem");
import PortalQueryParams = require("esri/portal/PortalQueryParams");

import {
  ApplicationConfig,
  ApplicationConfigs,
  BoilerplateApplicationResult,
  BoilerplateResults,
  BoilerplateSettings
} from "boilerplate/interfaces";

type Direction = "ltr" | "rtl";

class Boilerplate {

  // todo: support multiple webscenes, webmaps, groups.

  //--------------------------------------------------------------------------
  //
  //  Lifecycle
  //
  //--------------------------------------------------------------------------

  constructor(applicationConfigJSON, boilerplateConfigJSON) {
    this.settings = {
      ...boilerplateConfigJSON
    }
    this.config = applicationConfigJSON;
  }

  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------

  //----------------------------------
  //  settings
  //----------------------------------
  settings: BoilerplateSettings = {
    environment: {},
    webscene: {},
    webmap: {},
    group: {},
    portal: {},
    urlParams: []
  };

  //----------------------------------
  //  config
  //----------------------------------
  config: ApplicationConfig = null;

  //----------------------------------
  //  results
  //----------------------------------
  results: BoilerplateResults = {};

  //----------------------------------
  //  portal
  //----------------------------------
  portal: Portal = null;

  //----------------------------------
  //  direction
  //----------------------------------
  direction: Direction = null;

  //----------------------------------
  //  locale
  //----------------------------------
  locale = kernel.locale;

  //----------------------------------
  //  units
  //----------------------------------
  units: string = null;

  //--------------------------------------------------------------------------
  //
  //  Public Methods
  //
  //--------------------------------------------------------------------------

  queryGroupItems(groupId: string, itemParams: any, portal: Portal) {

    if (!portal) {
      portal = this.portal;
    }

    const paramOptions = {
      query: `group:"${groupId}" AND -type:"Code Attachment"`,
      sortField: "modified",
      sortOrder: "desc",
      num: 9,
      start: 1,
      ...itemParams
    };

    const params = new PortalQueryParams(paramOptions);
    return portal.queryItems(params);
  }

  load(): IPromise<Boilerplate> {
    const urlParams = this._getUrlParamValues(this.settings.urlParams);
    this.results.urlParams = urlParams

    this.config = this._mixinAllConfigs({
      config: this.config,
      url: urlParams
    });

    if (this.settings.environment.isEsri) {
      const esriPortalUrl = this._getEsriEnvironmentPortalUrl();
      this.config.portalUrl = esriPortalUrl;
      this.config.proxyUrl = this._getEsriEnvironmentProxyUrl(esriPortalUrl);
    }

    this._setPortalUrl(this.config.portalUrl)
    this._setProxyUrl(this.config.proxyUrl);

    this.direction = this._getLanguageDirection();

    const checkSignIn = this._checkSignIn(this.config.oauthappid, this.config.portalUrl);
    return checkSignIn.always(() => {
      const appId = this.config.appid;

      const queryApplicationItem = appId ?
        this._queryApplication(appId) :
        promiseUtils.resolve();

      const queryPortal = this.settings.portal.fetch ?
        this._queryPortal() :
        promiseUtils.resolve();

      return promiseUtils.eachAlways([
        queryApplicationItem,
        queryPortal
      ]).always(applicationArgs => {
        const [applicationResponse, portalResponse] = applicationArgs;

        const localStorage = this.settings.localStorage.fetch ?
          this._getLocalConfig(appId) :
          null;
        this.results.localStorage = localStorage;

        const applicationItem = applicationResponse ? applicationResponse.value as BoilerplateApplicationResult : null;
        const applicationItemData = applicationItem ? applicationItem.itemData : null;
        const applicationConfig = applicationItem ? applicationItemData.values : null;
        const applicationInfo = applicationItem ? applicationItem.itemInfo : null;
        this.results.application = applicationResponse;

        const portal = portalResponse ? portalResponse.value : null;
        this.portal = portal;
        this._setupCORS(portal.authorizedCrossOriginDomains, this.settings.environment.webTierSecurity);

        this.units = this._getUnits(portal);

        this.config = this._mixinAllConfigs({
          config: this.config,
          url: urlParams,
          local: localStorage,
          application: applicationConfig
        });

        const webMapId = this.config.webmap;
        const queryWebMapItem = webMapId && this.settings.webmap.fetch ?
          this._queryItem(webMapId) :
          promiseUtils.resolve();

        const webSceneId = this.config.webscene;
        const queryWebSceneItem = webSceneId && this.settings.webscene.fetch ?
          this._queryItem(webSceneId) :
          promiseUtils.resolve();

        const groupId = this.config.group;
        const queryGroupInfo = this.settings.group.fetchInfo && groupId ?
          this._queryGroupInfo(groupId, portal) :
          promiseUtils.resolve();

        const queryGroupItems = this.settings.group.fetchItems && groupId ?
          this.queryGroupItems(groupId, this.settings.group.itemParams, portal) :
          promiseUtils.resolve();

        return promiseUtils.eachAlways([
          queryWebMapItem,
          queryWebSceneItem,
          queryGroupInfo,
          queryGroupItems
        ]).always(itemArgs => {
          const [webMapResponse, webSceneResponse, groupInfoResponse, groupItemsResponse] = itemArgs;

          const webSceneItem = webSceneResponse ? webSceneResponse.value : null;
          const webMapItem = webMapResponse ? webMapResponse.value : null;

          // todo: mixin sourceUrl with proxyUrl
          // const appProxies = applicationInfo.appProxies;

          this.results.webMapItem = webMapResponse;
          this.results.webSceneItem = webSceneResponse;
          this.results.groupItems = groupItemsResponse;
          this.results.groupInfo = groupInfoResponse;

          const itemInfo = applicationItem ? applicationItem.itemInfo : null;

          this._overwriteItemExtent(webSceneItem, itemInfo);
          this._overwriteItemExtent(webMapItem, itemInfo);

          this._setGeometryService(this.config, this.portal);

          this.config.webmap = this._getDefaultId(this.config.webmap, this.settings.webmap.default);
          this.config.webscene = this._getDefaultId(this.config.webscene, this.settings.webscene.default);
          this.config.group = this._getDefaultId(this.config.group, this.settings.group.default);

          return this;
        });
      });
    });
  }

  //--------------------------------------------------------------------------
  //
  //  Private Methods
  //
  //--------------------------------------------------------------------------

  private _getUnits(portal: Portal): string {
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
    const units = userUnits ? userUnits : responseUnits ? responseUnits : isEnglishUnits ? "english" : "metric";
    return units;
  }

  private _getLocalConfig(appid: string): ApplicationConfig {
    if (!(window.localStorage && appid)) {
      return;
    }

    const localStoragePrefix = "boilerplate_config_";
    const lsItem = localStorage.getItem(localStoragePrefix + appid);
    const localConfig = lsItem && JSON.parse(lsItem);
    return localConfig;
  }

  private _queryItem(id: string): IPromise<PortalItem> {
    const item = new PortalItem({
      id: id
    });
    return item.load();
  }

  private _queryGroupInfo(groupId: string, portal: Portal): IPromise<any> {
    const params = new PortalQueryParams({
      query: `id:"${groupId}"`
    });
    return portal.queryGroups(params);
  }

  private _queryApplication(appid: string): IPromise<BoilerplateApplicationResult> {
    const appItem = new PortalItem({
      id: appid
    });
    return appItem.load().then(itemInfo => {
      return itemInfo.fetchData().then(itemData => {
        return {
          itemInfo: itemInfo,
          itemData: itemData
        };
      });
    });
  }

  private _setupCORS(authorizedDomains: any, webTierSecurity: boolean): void {
    if (!webTierSecurity || !authorizedDomains || !authorizedDomains.length) {
      return;
    }

    authorizedDomains.forEach(authorizedDomain => {
      const isDefined = (authorizedDomain !== undefined) && (authorizedDomain !== null);
      if (isDefined && authorizedDomain.length) {
        esriConfig.request.corsEnabledServers.push({
          host: authorizedDomain,
          withCredentials: true
        });
      }
    });
  }

  private _queryPortal(): IPromise<Portal> {
    return new Portal().load();
  }

  private _overwriteItemExtent(item: PortalItem, applicationItem: PortalItem): void {
    if (!item || !applicationItem) {
      return;
    }

    const applicationExtent = applicationItem.extent;

    item.extent = applicationExtent ? applicationExtent : item.extent;
  }

  private _setGeometryService(config: ApplicationConfig, ptl: Portal) {
    const portal = ptl as any; // todo: fix next api release. helperServices are not on portal currently.
    const configHelperServices = config.helperServices;
    const portalHelperServices = portal && portal.helperServices;
    const configGeometryUrl = configHelperServices && configHelperServices.geometry && configHelperServices.geometry.url;
    const portalGeometryUrl = portalHelperServices && portalHelperServices.geometry && portalHelperServices.geometry.url;
    const geometryUrl = portalGeometryUrl || configGeometryUrl;
    if (!geometryUrl) {
      return;
    }
    esriConfig.geometryServiceUrl = geometryUrl;
  }

  private _getDefaultId(id: string, defaultId: string): string {
    const defaultUrlParam = "default";
    const useDefaultId = (!id || id === defaultUrlParam) && defaultId;
    if (useDefaultId) {
      return defaultId;
    }
    return id;
  }

  private _getLanguageDirection(): Direction {
    const LTR = "ltr";
    const RTL = "rtl";
    const RTLLangs = ["ar", "he"];
    const isRTL = RTLLangs.some(language => {
      return kernel.locale.indexOf(language) !== -1;
    });
    return isRTL ? RTL : LTR;
  }

  private _mixinAllConfigs(params: ApplicationConfigs): ApplicationConfig {
    const config = params.config || null;
    const appConfig = params.application || null;
    const localConfig = params.local || null;
    const urlConfig = params.url || null;
    return {
      ...config,
      ...appConfig,
      ...localConfig,
      ...urlConfig
    }
  }

  private _setPortalUrl(portalUrl: string): void {
    esriConfig.portalUrl = portalUrl;
  }

  private _setProxyUrl(proxyUrl: string): void {
    esriConfig.request.proxyUrl = proxyUrl;
  }

  private _getEsriEnvironmentPortalUrl(): string {
    const esriAppsPath = "/apps/";
    const esriHomePath = "/home/";
    const esriAppsPathIndex = location.pathname.indexOf(esriAppsPath);
    const esriHomePathIndex = location.pathname.indexOf(esriHomePath);
    const isEsriAppsPath = esriAppsPathIndex !== -1 ? true : false;
    const isEsriHomePath = esriHomePathIndex !== -1 ? true : false;
    const appLocationIndex = isEsriAppsPath ? esriAppsPathIndex : isEsriHomePath ? esriHomePathIndex : null;

    if (!appLocationIndex) {
      return;
    }

    const portalInstance = location.pathname.substr(0, appLocationIndex);
    const host = location.host;
    return `https://${host}${portalInstance}`;
  }

  private _getEsriEnvironmentProxyUrl(portalUrl: string): string {
    const esriProxyPath = "/sharing/proxy";
    return `${portalUrl}${esriProxyPath}`;
  }

  private _checkSignIn(oauthappid: string, portalUrl: string): IPromise<void> {
    const sharingPath = "/sharing";
    const info = oauthappid ?
      new OAuthInfo({
        appId: oauthappid,
        portalUrl: portalUrl,
        popup: true
      }) : null;

    if (info) {
      IdentityManager.registerOAuthInfos([info]);
    }

    const signedIn = IdentityManager.checkSignInStatus(portalUrl + sharingPath);
    return signedIn.always(promiseUtils.resolve);
  }

  private _getUrlParamValues(urlParams: string[]): ApplicationConfig {
    const urlObject = this._urlToObject();
    const formattedUrlObject = {};

    if (!urlObject || !urlParams || !urlParams.length) {
      return;
    }

    urlParams.forEach(param => {
      const urlParamValue = urlObject[param];
      if (urlParamValue) {
        formattedUrlObject[param] = this._foramatUrlParamValue(urlParamValue);
      }
    });

    return formattedUrlObject;
  }

  private _urlToObject(): any {
    const query = (window.location.search || "?").substr(1),
      map = {};
    const urlRE = /([^&=]+)=?([^&]*)(?:&+|$)/g;
    query.replace(urlRE, (match, key, value) => {
      map[key] = this._stripStringTags(decodeURIComponent(value));
      return "";
    });
    return map;
  }

  private _foramatUrlParamValue(urlParamValue: any): any {
    if (typeof urlParamValue === "string") {
      switch (urlParamValue.toLowerCase()) {
        case "true":
          return true;
        case "false":
          return false;
        default:
          return urlParamValue;
      }
    }
    return urlParamValue;
  }

  private _stripStringTags(value: string) {
    const tagsRE = /<\/?[^>]+>/g;
    return value.replace(tagsRE, "");
  }

}

export default Boilerplate;
