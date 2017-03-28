/// <amd-dependency path='dojo/text!config/demoWebMap.json' name='webmapText' />
/// <amd-dependency path='dojo/text!config/demoWebScene.json' name='websceneText' />
declare const webmapText: string;
declare const websceneText: string;

import kernel = require('dojo/_base/kernel');
import esriConfig = require('esri/config');
import promiseUtils = require('esri/core/promiseUtils');
import IdentityManager = require('esri/identity/IdentityManager');
import OAuthInfo = require('esri/identity/OAuthInfo');
import Portal = require('esri/portal/Portal');
import PortalItem = require('esri/portal/PortalItem');
import PortalQueryParams = require('esri/portal/PortalQueryParams');

import { Settings, Config, BoilerplateResults, BoilerplateResponse } from 'boilerplate/interfaces';

const TAGS_RE = /<\/?[^>]+>/g;
const URL_RE = /([^&=]+)=?([^&]*)(?:&+|$)/g;
const SHARING_PATH = "/sharing";
const ESRI_PROXY_PATH = "/sharing/proxy";
const ESRI_APPS_PATH = "/apps/";
const ESRI_HOME_PATH = "/home/";
const RTL_LANGS = ["ar", "he"];
const LTR = "ltr";
const RTL = "rtl";
const LOCALSTORAGE_PREFIX = "boilerplate_config_";
const DEFAULT_URL_PARAM = "default";

// todo: have promise return results instead of setting using `this`

class Boilerplate {

  settings: Settings = null;
  config: Config = null;
  results: BoilerplateResults = {
    group: {}
  };
  portal: any = null;
  direction: string = null;
  locale: string = null;
  units: string = null;
  userPrivileges: any = null;

  constructor(applicationConfigJSON, boilerplateConfigJSON) {
    this.settings = {
      webscene: {},
      webmap: {},
      group: {},
      portal: {},
      urlItems: [],
      ...boilerplateConfigJSON
    }
    this.config = applicationConfigJSON;
  }

  public queryGroupItems() {
    if (!this.settings.group.fetchItems || !this.config.group) {
      return promiseUtils.resolve();
    }

    const itemParams = this.settings.group.itemParams;
    const groupId = this.config.group;
    const paramOptions = {
      query: `group:"${groupId}" AND -type:"Code Attachment"`,
      sortField: "modified",
      sortOrder: "desc",
      num: 9,
      start: 1,
      ...itemParams
    };

    const params = new PortalQueryParams(paramOptions);

    return this.portal.queryItems(params).then((response) => {
      this.results.group.itemsData = response;
      return this.results.group;
    }).otherwise((error) => {
      if (!error) {
        error = new Error("Boilerplate:: Error retrieving group items.");
      }
      this.results.group.itemsData = error;
      return error;
    });
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
    this.results.urlParams = {
      config: this._getUrlParamValues(this.settings.urlItems)
    };
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
    return this._checkSignIn().always(() => {
      // execute these tasks async
      return promiseUtils.eachAlways([
        // get application data
        this._queryApplicationItem(),
        // get org data
        this._queryPortal()
      ]).always(() => {
        // gets a temporary config from the users local storage
        this.results.localStorageConfig = this._getLocalConfig();
        // mixin all new settings from org and app
        this._mixinAllConfigs();
        // let's set up a few things
        this._completeApplication();
        // then execute these async
        return promiseUtils.eachAlways([
          // webmap item
          this._queryWebMapItem(),
          // webscene item
          this._queryWebSceneItem(),
          // group information
          this._queryGroupInfo(),
          // items within a specific group
          this.queryGroupItems()
        ]).always(() => {
          return {
            settings: this.settings,
            config: this.config,
            results: this.results,
            portal: this.portal,
            direction: this.direction,
            locale: this.locale,
            units: this.units,
            userPrivileges: this.userPrivileges
          };
        });
      });
    });
  }

  private _getLocalConfig(): Config {
    const appid = this.config.appid;
    if (window.localStorage && appid && this.settings.localConfig.fetch) {
      const lsItem = localStorage.getItem(LOCALSTORAGE_PREFIX + appid);
      const config = lsItem && JSON.parse(lsItem);
      return config || null;
    }
  }

  private _queryWebMapItem() {
    // Get details about the specified web map. If the web map is not shared publicly users will
    // be prompted to log-in by the Identity Manager.
    if (!this.settings.webmap.fetch) {
      return promiseUtils.resolve();
    }
    // Use local web map instead of portal web map
    if (this.settings.webmap.useLocal) {
      const json = JSON.parse(webmapText);
      this.results.webMapItem = {
        json
      };
      return promiseUtils.resolve(this.results.webMapItem);
    }
    // use webmap from id
    else if (this.config.webmap) {
      const mapItem = new PortalItem({
        id: this.config.webmap
      });
      return mapItem.load().then((itemData) => {
        this.results.webMapItem = {
          data: itemData
        };
        return this.results.webMapItem;
      }).otherwise((error) => {
        if (!error) {
          error = new Error("Boilerplate:: Error retrieving webmap item.");
        }
        this.results.webMapItem = {
          data: error
        };
        return error;
      });
    }
    else {
      return promiseUtils.resolve();
    }
  }

  private _queryGroupInfo() {
    // Get details about the specified group. If the group is not shared publicly users will
    // be prompted to log-in by the Identity Manager.
    if (!this.settings.group.fetchInfo || !this.config.group) {
      return promiseUtils.resolve();
    }
    // group params
    const params = new PortalQueryParams({
      query: `id:"${this.config.group}"`
    });
    return this.portal.queryGroups(params).then((response) => {
      this.results.group.infoData = response;
      return this.results.group;
    }).otherwise((error) => {
      if (!error) {
        error = new Error("Boilerplate:: Error retrieving group info.");
      }
      this.results.group.infoData = error;
      return error;
    });
  }

  private _queryWebSceneItem() {
    // Get details about the specified web scene. If the web scene is not shared publicly users will
    // be prompted to log-in by the Identity Manager.
    if (!this.settings.webscene.fetch) {
      return promiseUtils.resolve();
    }
    // Use local web scene instead of portal web scene
    if (this.settings.webscene.useLocal) {
      // get web scene js file
      const json = JSON.parse(websceneText);
      this.results.webSceneItem = {
        json: json
      };
      return promiseUtils.resolve(this.results.webSceneItem);
    }
    // use webscene from id
    else if (this.config.webscene) {
      const sceneItem = new PortalItem({
        id: this.config.webscene
      });
      return sceneItem.load().then((itemData) => {
        this.results.webSceneItem = {
          data: itemData
        };
        return this.results.webSceneItem;
      }).otherwise((error) => {
        if (!error) {
          error = new Error("Boilerplate:: Error retrieving webscene item.");
        }
        this.results.webSceneItem = {
          data: error
        };
        return error;
      });
    }
    else {
      return promiseUtils.resolve();
    }
  }

  private _queryApplicationItem() {
    // Get the application configuration details using the application id. When the response contains
    // itemData.values then we know the app contains configuration information. We'll use these values
    // to overwrite the application defaults.
    if (!this.config.appid) {
      return promiseUtils.resolve();
    }

    const appItem = new PortalItem({
      id: this.config.appid
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
        this.results.applicationItem = {
          data: itemInfo,
          config: cfg
        };
        return this.results.applicationItem;

      }).otherwise((error) => {
        if (!error) {
          error = new Error("Boilerplate:: Error retrieving application configuration data.");
        }
        this.results.applicationItem = {
          data: error,
          config: null
        };
        return error;
      });

    }).otherwise((error) => {
      if (!error) {
        error = new Error("Boilerplate:: Error retrieving application configuration.");
      }
      this.results.applicationItem = {
        data: error,
        config: null
      };
      return error
    });

  }

  private _setupCORS(authorizedDomains: any): void {
    if (this.settings.webTierSecurity && authorizedDomains && authorizedDomains.length) {
      authorizedDomains.forEach((authorizedDomain) => {
        if (this._isDefined(authorizedDomain) && authorizedDomain.length) {
          esriConfig.request.corsEnabledServers.push({
            host: authorizedDomain,
            withCredentials: true
          });
        }
      });
    }
  }

  private _queryPortal() {
    if (!this.settings.portal.fetch) {
      return promiseUtils.resolve();
    }
    // Query the ArcGIS.com organization. This is defined by the portalUrl that is specified. For example if you
    // are a member of an org you'll want to set the portalUrl to be http://<your org name>.arcgis.com. We query
    // the organization by making a self request to the org url which returns details specific to that organization.
    // Examples of the type of information returned are custom roles, units settings, helper services and more.
    // If this fails, the application will continue to function
    const portal = new Portal();
    this.portal = portal;
    return portal.load().then((response) => {
      this._setupCORS(response.authorizedCrossOriginDomains);
      const user = response.user;
      const roleId = user && user.roleId;
      const userPrivileges = user && user.privileges;
      const userRegion = user && user.region;
      const userUnits = user && user.units;
      const responseUnits = response.units;
      const responseRegion = response.region;
      const ipCountryCode = response.ipCntryCode;
      const isEnglishUnits = (userRegion === "US") ||
        (userRegion && responseRegion === "US") ||
        (userRegion && !responseRegion) ||
        (!user && ipCountryCode === "US") ||
        (!user && !ipCountryCode && kernel.locale === "en-us");
      const units = userUnits ? userUnits : responseUnits ? responseUnits : isEnglishUnits ? "english" : "metric";
      this.units = units;
      // are any custom roles defined in the organization?
      if (roleId && this._isDefined(roleId) && userPrivileges) {
        this.userPrivileges = userPrivileges;
      }
      // set data for portal on boilerplate
      this.results.portal = {
        data: response
      };
      return this.results.portal;
    }).otherwise((error) => {
      if (!error) {
        error = new Error("Boilerplate:: Error retrieving organization information.");
      }
      this.results.portal = {
        data: error
      };
      return error;
    });
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

  private _completeApplication(): void {
    // ArcGIS.com allows you to set an application extent on the application item. Overwrite the
    // existing extents with the application item extent when set.
    const applicationExtent = this.config.application_extent;
    const results = this.results;
    if (this.config.appid && applicationExtent && applicationExtent.length > 0) {
      this._overwriteExtent(results.webSceneItem.data, applicationExtent);
      this._overwriteExtent(results.webMapItem.data, applicationExtent);
    }
    // get helper services
    const configHelperServices = this.config.helperServices;
    const portalHelperServices = this.portal && this.portal.helperServices;
    // see if config has a geometry service
    const configGeometryUrl = configHelperServices && configHelperServices.geometry && configHelperServices.geometry.url;
    // seee if portal has a geometry service
    const portalGeometryUrl = portalHelperServices && portalHelperServices.geometry && portalHelperServices.geometry.url;
    // use the portal geometry service or config geometry service
    const geometryUrl = portalGeometryUrl || configGeometryUrl;
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
  }

  private _setLangProps() {
    const isRTL = RTL_LANGS.some((language) => {
      return kernel.locale.indexOf(language) !== -1;
    });
    let direction = isRTL ? RTL : LTR;
    // set boilerplate language direction
    this.direction = direction;
    // set boilerplate langauge locale
    this.locale = kernel.locale;
  }

  private _mixinAllConfigs() {
    const config = this.config;
    const applicationItem = this.results.applicationItem ? this.results.applicationItem.config : null;
    const localStorageConfig = this.results.localStorageConfig;
    const urlParams = this.results.urlParams ? this.results.urlParams.config : null;
    this.config = {
      ...config,
      ...applicationItem,
      ...localStorageConfig,
      ...urlParams
    }
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

  private _getUrlParamValues(urlParams: string[]) {
    const urlObject = this._urlToObject();
    const formattedUrlObject = {};

    if (!urlObject || !urlParams || !urlParams.length) {
      return;
    }

    urlParams.forEach((param) => {
      const urlParamValue = urlObject[param];
      if (urlParamValue) {
        formattedUrlObject[param] = this._foramatUrlParamValue(urlParamValue);
      }
    });

    return formattedUrlObject;
  }

  private _initializeApplication() {
    if (this.settings.esriEnvironment) {
      const esriAppsPath = location.pathname.indexOf(ESRI_APPS_PATH);
      const esriHomePath = location.pathname.indexOf(ESRI_HOME_PATH);
      const isEsriAppsPath = esriAppsPath !== -1 ? true : false;
      const isEsriHomePath = esriHomePath !== -1 ? true : false;
      const appLocation = isEsriAppsPath ? esriAppsPath : isEsriHomePath ? esriHomePath : null;
      if (appLocation) {
        const portalInstance = location.pathname.substr(0, appLocation);
        this.config.portalUrl = "https://" + location.host + portalInstance;
        this.config.proxyUrl = "https://" + location.host + portalInstance + ESRI_PROXY_PATH;
      }
    }
    esriConfig.portalUrl = this.config.portalUrl;
    if (this.config.proxyUrl) {
      esriConfig.request.proxyUrl = this.config.proxyUrl;
    }
  }

  private _checkSignIn() {
    const info = this.config.oauthappid ?
      new OAuthInfo({
        appId: this.config.oauthappid,
        portalUrl: this.config.portalUrl,
        popup: true
      }) : null;

    if (info) {
      IdentityManager.registerOAuthInfos([info]);
    }

    const signedIn = IdentityManager.checkSignInStatus(this.config.portalUrl + SHARING_PATH);
    return signedIn.always(promiseUtils.resolve);
  }

  private _isDefined(value: any) {
    return (value !== undefined) && (value !== null);
  }

  private _stripStringTags(value: string) {
    return value.replace(TAGS_RE, "");
  }

  private _urlToObject() {
    // retrieve url parameters. Templates all use url parameters to determine which arcgis.com
    // resource to work with.
    // Scene templates use the webscene param to define the scene to display
    // appid is the id of the application based on the template. We use this
    // id to retrieve application specific configuration information. The configuration
    // information will contain the values the  user selected on the template configuration
    // panel.
    const query = (window.location.search || "?").substr(1),
      map = {};
    query.replace(URL_RE, (match, key, value) => {
      map[key] = this._stripStringTags(decodeURIComponent(value));
      return '';
    });
    return map;
  }
}

export default Boilerplate;