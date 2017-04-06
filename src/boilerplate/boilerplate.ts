import kernel = require("dojo/_base/kernel");
import esriConfig = require("esri/config");
import Extent = require("esri/geometry/Extent");
import EsriPromise = require("esri/core/Promise"); // todo: make this class extend promise
import promiseUtils = require("esri/core/promiseUtils");
import IdentityManager = require("esri/identity/IdentityManager");
import OAuthInfo = require("esri/identity/OAuthInfo");
import Portal = require("esri/portal/Portal");
import PortalItem = require("esri/portal/PortalItem");
import PortalQueryParams = require("esri/portal/PortalQueryParams");
import { getUrlParamValues } from "boilerplate/UrlParamHelper";
import { ApplicationConfig, ApplicationConfigs, BoilerplateApplicationResult, BoilerplateResults, BoilerplateResponse, BoilerplateSettings } from "boilerplate/interfaces"; // todo: multiline

class Boilerplate {

  settings: BoilerplateSettings = {
    environment: {},
    webscene: {},
    webmap: {},
    group: {},
    portal: {},
    urlParams: []
  };
  config: ApplicationConfig = null;
  results: BoilerplateResults = {
    group: {}
  };
  portal: any = null;
  direction: string = null;
  locale: string = kernel.locale;
  units: string = null;

  constructor(applicationConfigJSON, boilerplateConfigJSON) {
    this.settings = {
      ...boilerplateConfigJSON
    }
    this.config = applicationConfigJSON;
  }

  public queryGroupItems(groupId: string, itemParams: any, portal: Portal) {
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

  public init(): IPromise<BoilerplateResponse> {
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
    const urlParams = getUrlParamValues(this.settings.urlParams);
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

        const applicationItem = applicationResponse.value;
        const applicationConfig = applicationItem ? applicationItem.itemData.values : null;
        this.results.applicationItem = applicationItem;

        const portal = portalResponse.value;
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
          this._queryWebMapItem(webMapId) :
          promiseUtils.resolve();

        const webSceneId = this.config.webscene;
        const queryWebSceneItem = webSceneId && this.settings.webscene.fetch ?
          this._queryWebSceneItem(webSceneId) :
          promiseUtils.resolve();

        const groupId = this.config.group;
        const queryGroupInfo = this.settings.group.fetchInfo && groupId ?
          this._queryGroupInfo(groupId, portal) :
          promiseUtils.resolve();

        const queryGroupItems = this.settings.group.fetchItems || groupId ?
          this.queryGroupItems(groupId, this.settings.group.itemParams, portal) :
          promiseUtils.resolve();

        return promiseUtils.eachAlways([
          queryWebMapItem,
          queryWebSceneItem,
          queryGroupInfo,
          queryGroupItems
        ]).always(itemArgs => {
          const [webMapResponse, webSceneResponse, groupInfoResponse, groupItemsResponse] = itemArgs;

          const webSceneItem = webSceneResponse.value || webSceneResponse.error;
          const webMapItem = webMapResponse.value || webMapResponse.error;
          this.results.webMapItem = webMapItem;
          this.results.webSceneItem = webSceneItem;
          this.results.group.itemsData = groupItemsResponse.value || groupItemsResponse.error;
          this.results.group.infoData = groupInfoResponse.value || groupInfoResponse.error;

          this._overwriteItemExtent(webSceneItem, applicationItem.itemInfo);
          this._overwriteItemExtent(webMapItem, applicationItem.itemInfo);

          this._setGeometryService(this.config, this.portal);

          this.config.webmap = this._getDefaultId(this.config.webmap, this.settings.webmap.default);
          this.config.webscene = this._getDefaultId(this.config.webscene, this.settings.webscene.default);
          this.config.group = this._getDefaultId(this.config.group, this.settings.group.default);

          // todo: do we need these on the class or just returned?
          return {
            settings: this.settings,
            config: this.config,
            results: this.results,
            portal: this.portal,
            direction: this.direction,
            locale: this.locale,
            units: this.units
          };
        });
      });
    });
  }

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

  private _queryWebMapItem(webMapId: string): IPromise<PortalItem> {
    const mapItem = new PortalItem({
      id: webMapId
    });
    return mapItem.load();
  }

  private _queryGroupInfo(groupId: string, portal: Portal): IPromise<any> {
    const params = new PortalQueryParams({
      query: `id:"${groupId}"`
    });
    return portal.queryGroups(params);
  }

  private _queryWebSceneItem(webSceneId: string): IPromise<PortalItem> {
    const sceneItem = new PortalItem({
      id: webSceneId
    });
    return sceneItem.load();
  }

  // todo: need to figure out the  layermixins
  private _queryApplication(appid: string): IPromise<BoilerplateApplicationResult> {
    const appItem = new PortalItem({
      id: appid
    });
    return appItem.load().then((itemInfo) => {
      return itemInfo.fetchData().then((itemData) => {
        // todo: app proxies
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
          itemInfo: itemInfo,
          itemData: itemData
        };
      });
    });
  }

  private _setupCORS(authorizedDomains: any, webTierSecurity: boolean): void {
    if (webTierSecurity && authorizedDomains && authorizedDomains.length) {
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
  }

  private _queryPortal(): IPromise<Portal> {
    return new Portal().load();
  }

  private _overwriteItemExtent(item: PortalItem | Error, applicationItem: PortalItem | Error): void {
    if (applicationItem instanceof Error || item instanceof Error || !applicationItem || !item) {
      return;
    }

    const applicationExtent = applicationItem.extent;

    item.extent = applicationExtent ? applicationExtent : item.extent;
  }

  private _setGeometryService(config: ApplicationConfig, portal: any) { // todo: fix next api release
    // get helper services
    const configHelperServices = config.helperServices;
    const portalHelperServices = portal && portal.helperServices;
    // see if config has a geometry service
    const configGeometryUrl = configHelperServices && configHelperServices.geometry && configHelperServices.geometry.url;
    // seee if portal has a geometry service
    const portalGeometryUrl = portalHelperServices && portalHelperServices.geometry && portalHelperServices.geometry.url;
    // use the portal geometry service or config geometry service
    const geometryUrl = portalGeometryUrl || configGeometryUrl;
    if (!geometryUrl) {
      return;
    }
    // set the esri config to use the geometry service
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

  private _getLanguageDirection(): string {
    const LTR = "ltr";
    const RTL = "rtl";
    const RTLLangs = ["ar", "he"];
    const isRTL = RTLLangs.some((language) => {
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

}

export default Boilerplate;
