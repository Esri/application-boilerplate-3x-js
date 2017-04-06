import kernel = require("dojo/_base/kernel");
import esriConfig = require("esri/config");
import EsriPromise = require("esri/core/Promise"); // todo: make this class extend promise
import promiseUtils = require("esri/core/promiseUtils");
import IdentityManager = require("esri/identity/IdentityManager");
import OAuthInfo = require("esri/identity/OAuthInfo");
import Portal = require("esri/portal/Portal");
import PortalItem = require("esri/portal/PortalItem");
import PortalQueryParams = require("esri/portal/PortalQueryParams");
import { getUrlParamValues } from "boilerplate/UrlParamHelper";
import { BoilerplateSettings, ApplicationConfig, BoilerplateResults, BoilerplateResponse } from "boilerplate/interfaces";

function isDefined(value: any) {
  return (value !== undefined) && (value !== null);
}

class Boilerplate {

  settings: BoilerplateSettings = {
    webscene: {},
    webmap: {},
    group: {},
    portal: {},
    urlItems: []
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
    const urlParams = getUrlParamValues(this.settings.urlItems);
    this.results.urlParams = urlParams
    // config defaults <- standard url params
    // we need the web scene, appid,and oauthappid to query for the data
    this._mixinAllConfigs(); // todo
    // Define the portalUrl and other default values like the proxy.
    // The portalUrl defines where to search for the web map and application content. The
    // default value is arcgis.com.
    if (this.settings.esriEnvironment) {
      const esriPortalUrl = this._getEsriEnvironmentPortalUrl();
      this.config.portalUrl = esriPortalUrl;
      this.config.proxyUrl = this._getEsriEnvironmentProxyUrl(esriPortalUrl);
    }

    this._setPortalUrl(this.config.portalUrl)
    this._setProxyUrl(this.config.proxyUrl);

    this.direction = this._getLanguageDirection();

    const checkSignIn = this._checkSignIn(this.config.oauthappid, this.config.portalUrl);




    // check if signed in. Once we know if we're signed in, we can get data and create a portal if needed.
    return checkSignIn.always(() => {



      const appId = this.config.appid;
      const queryApplicationItem = appId ?
        this._queryApplicationItem(appId) :
        promiseUtils.resolve();

      const queryPortal = this.settings.portal.fetch ?
        this._queryPortal() :
        promiseUtils.resolve();

      // execute these tasks async
      return promiseUtils.eachAlways([
        // get application data
        queryApplicationItem,
        // get org data
        queryPortal
      ]).always(applicationArgs => {
        const [applicationResponse, portalResponse] = applicationArgs;


        // gets a temporary config from the users local storage
        this.results.localStorageConfig = this.settings.localConfig.fetch ?
          this._getLocalConfig(appId) :
          null;
        this.results.applicationItem = applicationResponse.value;
        const portal = portalResponse.value;
        this.portal = portal;
        this._setupCORS(portal.authorizedCrossOriginDomains, this.settings.webTierSecurity);

        this.units = this._getUnits(portal);








        // mixin all new settings from org and app
        this._mixinAllConfigs();
        // let's set up a few things
        this._completeApplication();

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

        // then execute these async
        return promiseUtils.eachAlways([
          // webmap item
          queryWebMapItem,
          // webscene item
          queryWebSceneItem,
          // group information
          queryGroupInfo,
          // items within a specific group
          queryGroupItems
        ]).always(itemArgs => {
          const [webMapResponse, webSceneResponse, groupInfoResponse, groupItemsResponse] = itemArgs;

          this.results.webMapItem = webMapResponse.value;
          this.results.webSceneItem = webSceneResponse.value;
          this.results.group.itemsData = groupItemsResponse.value;
          this.results.group.infoData = groupInfoResponse.value;

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
  private _getLocalConfig(appid: string): BoilerplateSettings {
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
    // Get details about the specified group. If the group is not shared publicly users will
    // be prompted to log-in by the Identity Manager.
    // group params
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

  private _queryApplicationItem(appid: string): IPromise<any> {
    // Get the application configuration details using the application id. When the response contains
    // itemData.values then we know the app contains configuration information. We'll use these values
    // to overwrite the application defaults.
    const appItem = new PortalItem({
      id: appid
    });
    return appItem.load().then((itemInfo) => {
      return itemInfo.fetchData().then((data) => {
        const cfg = data && data.values || {};
        const appProxies = itemInfo.appProxies;
        // get the extent for the application item. This can be used to override the default web map extent
        if (itemInfo.extent) {
          cfg.application_extent = itemInfo.extent;
        }
        // get any app proxies defined on the application item
        if (appProxies) {
          const layerMixins = appProxies.map((p) => {
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
      }).otherwise((error) => {
        return {
          error: error || new Error("Boilerplate:: Error retrieving application configuration data.")
        };
      });
    }).otherwise((error) => {
      return {
        error: error || new Error("Boilerplate:: Error retrieving application configuration.")
      };
    });

  }

  private _setupCORS(authorizedDomains: any, webTierSecurity: boolean): void {
    if (webTierSecurity && authorizedDomains && authorizedDomains.length) {
      authorizedDomains.forEach((authorizedDomain) => {
        if (isDefined(authorizedDomain) && authorizedDomain.length) {
          esriConfig.request.corsEnabledServers.push({
            host: authorizedDomain,
            withCredentials: true
          });
        }
      });
    }
  }

  private _queryPortal(): IPromise<Portal> {
    // Query the ArcGIS.com organization. This is defined by the portalUrl that is specified. For example if you
    // are a member of an org you'll want to set the portalUrl to be http://<your org name>.arcgis.com. We query
    // the organization by making a self request to the org url which returns details specific to that organization.
    // Examples of the type of information returned are custom roles, units settings, helper services and more.
    // If this fails, the application will continue to function
    return new Portal().load();
  }

  private _overwriteExtent(itemInfo, extent): void {
    const item = itemInfo && itemInfo.item;
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
  }

  private _getGeometryService(config: ApplicationConfig, portal: any) { // todo
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

  // todo: rewrite function without `this`
  private _completeApplication(): void {

    // ArcGIS.com allows you to set an application extent on the application item. Overwrite the
    // existing extents with the application item extent when set.
    // todo
    const applicationExtent = this.config.application_extent;
    const results = this.results;
    if (this.config.appid && applicationExtent && applicationExtent.length > 0) {
      this._overwriteExtent(results.webSceneItem.data, applicationExtent);
      this._overwriteExtent(results.webMapItem.data, applicationExtent);
    }

    // todo
    this._getGeometryService(this.config, this.portal);

    // todo
    const defaultUrlParam = "default";
    if ((!this.config.webmap || this.config.webmap === defaultUrlParam) && this.settings.defaultWebmap) {
      this.config.webmap = this.settings.defaultWebmap;
    }
    if ((!this.config.webscene || this.config.webscene === defaultUrlParam) && this.settings.defaultWebscene) {
      this.config.webscene = this.settings.defaultWebscene;
    }
    if ((!this.config.group || this.config.group === defaultUrlParam) && this.settings.defaultGroup) {
      this.config.group = this.settings.defaultGroup;
    }
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

  // todo: pass in arguments for mixin as MixinParams
  private _mixinAllConfigs() {
    const config = this.config;
    const applicationItem = this.results.applicationItem ? this.results.applicationItem.config : null;
    const localStorageConfig = this.results.localStorageConfig;
    const urlParams = this.results.urlParams ? this.results.urlParams : null;
    this.config = {
      ...config,
      ...applicationItem,
      ...localStorageConfig,
      ...urlParams
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

  private _checkSignIn(oauthappid: string, portalUrl: string): IPromise<any> {
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
