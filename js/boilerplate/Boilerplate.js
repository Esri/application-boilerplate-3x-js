define([

  "dojo/text!config/config.json",
  "dojo/text!./settings.json",

  "dojo/_base/kernel",
  "dojo/_base/lang",

  "dojo/Deferred",

  "esri/config",

  "esri/core/Promise",
  "esri/core/promiseList",

  "esri/identity/IdentityManager",
  "esri/identity/OAuthInfo",

  "esri/portal/Portal",
  "esri/portal/PortalItem"

], function (
  applicationConfig, boilerplateSettings,
  kernel, lang,
  Deferred,
  esriConfig,
  Promise, promiseList,
  IdentityManager, OAuthInfo,
  Portal, PortalItem
) {

  //--------------------------------------------------------------------------
  //
  //  Static Variables
  //
  //--------------------------------------------------------------------------

  var TAGS_RE = /<\/?[^>]+>/g;
  var URL_RE = /([^&=]+)=?([^&]*)(?:&+|$)/g;
  var SHARING_PATH = "/sharing";
  var ESRI_PROXY_PATH = "/sharing/proxy";
  var ESRI_APPS_PATH = "/apps/";
  var ESRI_HOME_PATH = "/home/";

  return Promise.createSubclass({

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    settings: null,

    config: null,

    results: null,

    portal: null,

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function () {
      // convert text to JSON
      var boilerplateSettingsJSON = JSON.parse(boilerplateSettings);
      var applicationConfigJSON = JSON.parse(applicationConfig);
      // mixin defaults with boilerplate configuration
      this.settings = boilerplateSettingsJSON;
      // config will contain application and user defined info for the application such as the web scene id and application id, any url parameters and any application specific configuration information.
      this.config = applicationConfigJSON;
      // stores results from queries
      this.results = {};
      // initialization
      var initPromise = this._init();
      this.addResolvingPromise(initPromise);
    },

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    // todo: accept arguments on public methods

    queryWebmapItem: function () {
      var deferred;
      // Get details about the specified web scene. If the web scene is not shared publicly users will
      // be prompted to log-in by the Identity Manager.
      deferred = new Deferred();
      if (!this.settings.webmap.fetch) {
        deferred.resolve();
      }
      else {
        this.results.webmapItem = {};
        // Use local web scene instead of portal web scene
        if (this.settings.webmap.useLocal) {
          // get web scene js file
          require(["dojo/text!" + this.settings.webmap.localFile], function (webmapText) {
            // return web scene json
            var json = JSON.parse(webmapText);
            this.results.webmapItem.json = json;
            deferred.resolve(this.results.webmapItem);
          }.bind(this));
        }
        // no web scene is set and we have organization's info
        else if (!this.config.webmap && this.results.portal.data) {
          var defaultWebmap = {
            "operationalLayers": [],
            "baseMap": {
              "baseMapLayers": [{
                "id": "defaultBasemap",
                "layerType": "ArcGISTiledMapServiceLayer",
                "opacity": 1,
                "visibility": true,
                "url": "http://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer"
              }],
              "title": "Topographic"
            },
            "version": "2.1"
          };
          this.results.webmapItem.json = defaultWebmap;
          deferred.resolve(this.results.webmapItem);
        }
        // use webmap from id
        else {
          var mapItem = new PortalItem({
            id: this.config.webmap
          }).load();
          mapItem.then(function (itemData) {
            this.results.webmapItem.data = itemData;
            deferred.resolve(this.results.webmapItem);
          }.bind(this), function (error) {
            if (!error) {
              error = new Error("Error retrieving webmap item.");
            }
            deferred.reject(error);
          });
        }
      }
      return deferred.promise;
    },

    // todo: accept arguments
    queryGroupInfo: function () {
      // todo

      /*
      var deferred = new Deferred(),
        error, params;
      // If we want to get the group info
      if (this.templateConfig.group.fetchInfo) {
        if (this.config.group) {
          // group params
          params = {
            q: "id:\"" + this.config.group + "\"",
            f: "json"
          };
          this.portal.queryGroups(params).then(lang.hitch(this, function (response) {
            var cfg = {};
            cfg.groupInfo = response;
            this.groupInfoConfig = cfg;
            deferred.resolve(cfg);
          }), function (error) {
            deferred.reject(error);
          });
        } else {
          error = new Error("Group undefined.");
          deferred.reject(error);
        }
      } else {
        // just resolve
        deferred.resolve();
      }
      return deferred.promise;
      */

    },

    queryGroupItems: function () {
      // todo

      /*

      var deferred = new Deferred(),
        error, defaultParams, params;
      // If we want to get the group info
      if (this.templateConfig.group.fetchItems) {
        if (this.config.group) {
          // group params
          defaultParams = {
            q: "group:\"${groupid}\" AND -type:\"Code Attachment\"",
            sortField: "modified",
            sortOrder: "desc",
            num: 9,
            start: 0,
            f: "json"
          };
          // mixin params
          params = lang.mixin(defaultParams, this.templateConfig.group.itemParams, options);
          // place group ID
          if (params.q) {
            params.q = string.substitute(params.q, {
              groupid: this.config.group
            });
          }
          // get items from the group
          this.portal.queryItems(params).then(lang.hitch(this, function (response) {
            var cfg = {};
            cfg.groupItems = response;
            this.groupItemConfig = cfg;
            deferred.resolve(cfg);
          }), function (error) {
            deferred.reject(error);
          });
        } else {
          error = new Error("Group undefined.");
          deferred.reject(error);
        }
      } else {
        // just resolve
        deferred.resolve();
      }
      return deferred.promise;

      */
    },

    queryWebsceneItem: function () {
      var deferred, sceneItem;
      // Get details about the specified web scene. If the web scene is not shared publicly users will
      // be prompted to log-in by the Identity Manager.
      deferred = new Deferred();
      if (!this.settings.webscene.fetch) {
        deferred.resolve();
      }
      else {
        this.results.websceneItem = {};
        // Use local web scene instead of portal web scene
        if (this.settings.webscene.useLocal) {
          // get web scene js file
          require(["dojo/text!" + this.settings.webscene.localFile], function (websceneText) {
            // return web scene json
            var json = JSON.parse(websceneText);
            this.results.websceneItem.json = json;
            deferred.resolve(this.results.websceneItem);
          }.bind(this));
        }
        // no web scene is set and we have organization's info
        else if (!this.config.webscene && this.results.portal.data) {
          var defaultWebscene = {
            "operationalLayers": [],
            "version": "1.3"
          };
          this.results.websceneItem.json = defaultWebscene;
          deferred.resolve(this.results.websceneItem);
        }
        // use webscene from id
        else {
          sceneItem = new PortalItem({
            id: this.config.webscene
          }).load();
          sceneItem.then(function (itemData) {
            this.results.websceneItem.data = itemData;
            deferred.resolve(this.results.websceneItem);
          }.bind(this), function (error) {
            if (!error) {
              error = new Error("Error retrieving webscene item.");
            }
            deferred.reject(error);
          });
        }
      }
      return deferred.promise;
    },

    queryApplicationItem: function () {
      // Get the application configuration details using the application id. When the response contains
      // itemData.values then we know the app contains configuration information. We'll use these values
      // to overwrite the application defaults.
      var deferred = new Deferred();
      if (!this.config.appid) {
        deferred.resolve();
      }
      else {
        var appItem = new PortalItem({
          id: this.config.appid
        }).load();
        appItem.then(function (itemData) {
          var cfg = {};
          if (itemData && itemData.values) {
            // get app config values - we'll merge them with config later.
            cfg = itemData.values;
          }
          // get the extent for the application item. This can be used to override the default web map extent
          if (itemData.item && itemData.item.extent) {
            cfg.application_extent = itemData.item.extent;
          }
          // get any app proxies defined on the application item
          if (itemData.item && itemData.item.appProxies) {
            var layerMixins = itemData.item.appProxies.map(function (p) {
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
            data: itemData,
            config: cfg
          };
          deferred.resolve(this.results.applicationItem);
        }.bind(this), function (error) {
          if (!error) {
            error = new Error("Error retrieving application configuration.");
          }
          deferred.reject(error);
        });
      }
      return deferred.promise;
    },

    queryPortal: function () {
      var deferred = new Deferred();
      if (!this.settings.portal.fetch) {
        deferred.resolve();
      }
      else {
        // Query the ArcGIS.com organization. This is defined by the portalUrl that is specified. For example if you
        // are a member of an org you'll want to set the portalUrl to be http://<your org name>.arcgis.com. We query
        // the organization by making a self request to the org url which returns details specific to that organization.
        // Examples of the type of information returned are custom roles, units settings, helper services and more.
        // If this fails, the application will continue to function
        var portal = new Portal().load();
        this.portal = portal;
        portal.then(function (response) {
          if (this.settings.webTierSecurity) {
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
          // get units defined by the org or the org user
          cfg.units = "metric";
          if (response.user && response.user.units) { //user defined units
            cfg.units = response.user.units;
          }
          else if (response.units) { //org level units
            cfg.units = response.units;
          }
          else if ((response.user && response.user.region && response.user.region === "US") || (response.user && !response.user.region && response.region === "US") || (response.user && !response.user.region && !response.region) || (!response.user && response.ipCntryCode === "US") || (!response.user && !response.ipCntryCode && kernel.locale === "en-us")) {
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
          this.results.portal = {
            config: cfg,
            data: response
          };
          deferred.resolve(this.results.portal);
        }.bind(this), function (error) {
          if (!error) {
            error = new Error("Error retrieving organization information.");
          }
          deferred.reject(error);
        });
      }
      return deferred.promise;
    },

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    // Get URL parameters and set application defaults needed to query arcgis.com for
    // an application and to see if the app is running in Portal or an Org
    _init: function () {
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
      // check if signed in. Once we know if we're signed in, we can get data and create a portal if needed.
      return this._checkSignIn().always(function () {
        // execute these tasks async
        return promiseList({
          // get application data
          applicationItem: this.queryApplicationItem(),
          // get org data
          portal: this.queryPortal()
        }).always(function () {
          // mixin all new settings from org and app
          this._mixinAllConfigs();
          // let's set up a few things
          this._completeApplication();
          // then execute these async
          return promiseList({
            // webmap item
            webmapItem: this.queryWebmapItem(),
            // webscene item
            websceneItem: this.queryWebsceneItem()
          });
        }.bind(this));
      }.bind(this));
    },

    _overwriteExtent: function (itemInfo, extent) {
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
    },

    _completeApplication: function () {
      // ArcGIS.com allows you to set an application extent on the application item. Overwrite the
      // existing extents with the application item extent when set.
      if (this.config.appid && this.config.application_extent && this.config.application_extent.length > 0) {
        this._overwriteExtent(this.results.websceneItem.data, this.config.application_extent);
        this._overwriteExtent(this.results.webmapItem.data, this.config.application_extent);
      }
      // Set the geometry helper service to be the app default.
      if (this.config.helperServices && this.config.helperServices.geometry && this.config.helperServices.geometry.url) {
        esriConfig.geometryServiceUrl = this.config.helperServices.geometry.url;
      }
    },

    _mixinAllConfigs: function () {
      /*
      mix in all the settings we got!
      config <- portal settings <- application settings <- url params
      */
      lang.mixin(
        this.config,
        this.results.portal ? this.results.portal.config : null,
        this.results.applicationItem ? this.results.applicationItem.config : null,
        this.results.urlParams ? this.results.urlParams.config : null
      );
    },

    _getUrlParamValues: function (items) {
      // retrieves only the items specified from the URL object.
      // Gets parameters from the URL, convert them to an object and remove HTML tags.
      var urlObject = this._createUrlParamsObject();
      var obj = {};
      if (urlObject && items && items.length) {
        for (var i = 0; i < items.length; i++) {
          var item = urlObject[items[i]];
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
            }
            else {
              obj[items[i]] = item;
            }
          }
        }
      }
      return obj;
    },

    _createUrlParamsObject: function () {
      // retrieve url parameters. Templates all use url parameters to determine which arcgis.com
      // resource to work with.
      // Scene templates use the webscene param to define the scene to display
      // appid is the id of the application based on the template. We use this
      // id to retrieve application specific configuration information. The configuration
      // information will contain the values the  user selected on the template configuration
      // panel.
      return this._stripTags(this._urlToObject());
    },

    _initializeApplication: function () {
      // If this app is hosted on an Esri environment.
      if (this.settings.esriEnvironment) {
        var appLocation, instance;
        // Check to see if the app is hosted or a portal. If the app is hosted or a portal set the
        // portalUrl and the proxy. Otherwise use the portalUrl set it to arcgis.com.
        // We know app is hosted (or portal) if it has /apps/ or /home/ in the url.
        appLocation = location.pathname.indexOf(ESRI_APPS_PATH);
        if (appLocation === -1) {
          appLocation = location.pathname.indexOf(ESRI_HOME_PATH);
        }
        // app is hosted and no portalUrl is defined so let's figure it out.
        if (appLocation !== -1) {
          // hosted or portal
          instance = location.pathname.substr(0, appLocation); //get the portal instance name
          this.config.portalUrl = location.protocol + "//" + location.host + instance;
          this.config.proxyUrl = location.protocol + "//" + location.host + instance + ESRI_PROXY_PATH;
        }
      }
      esriConfig.portalUrl = this.config.portalUrl;
      // Define the proxy url for the app
      if (this.config.proxyUrl) {
        esriConfig.request.proxyUrl = this.config.proxyUrl;
      }
    },

    _checkSignIn: function () {
      var deferred, signedIn, oAuthInfo;
      deferred = new Deferred();
      //If there's an oauth appid specified register it
      if (this.config.oauthappid) {
        oAuthInfo = new OAuthInfo({
          appId: this.config.oauthappid,
          portalUrl: this.config.portalUrl,
          popup: true
        });
        IdentityManager.registerOAuthInfos([oAuthInfo]);
      }
      // check sign-in status
      signedIn = IdentityManager.checkSignInStatus(this.config.portalUrl + SHARING_PATH);
      // resolve regardless of signed in or not.
      signedIn.always(deferred.resolve);
      return deferred.promise;
    },

    _isDefined: function (value) {
      return (value !== undefined) && (value !== null);
    },

    _stripTags: function (data) {
      if (data) {
        // get type of data
        var t = typeof data;
        if (t === "string") {
          // remove tags from a string
          data = data.replace(TAGS_RE, "");
        }
        else if (t === "object") {
          // remove tags from an object
          for (var item in data) {
            var currentItem = data[item];
            if (currentItem && typeof currentItem === "string") {
              //strip html tags
              currentItem = currentItem.replace(TAGS_RE, "");
            }
            // set item back on data
            data[item] = currentItem;
          }
        }
      }
      return data;
    },

    _urlToObject: function () {
      var query = (window.location.search || "?").substr(1),
        map = {};
      query.replace(URL_RE, function (match, key, value) {
        map[key] = value;
      });
      return map;
    }
  });
});
