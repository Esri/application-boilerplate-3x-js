define([

  "dojo/text!config/config.json",
  "dojo/text!./config.json",

  "dojo/_base/declare",
  "dojo/_base/kernel",
  "dojo/_base/lang",

  "dojo/Deferred",

  "esri/config",

  "esri/core/promiseList",

  "esri/identity/IdentityManager",
  "esri/identity/OAuthInfo",

  "esri/portal/Portal",
  "esri/portal/PortalItem"

], function (
  applicationConfig, boilerplateConfig,
  declare, kernel, lang,
  Deferred,
  esriConfig,
  promiseList,
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

  return declare([Deferred], {

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    config: {},
    orgConfig: {},
    appConfig: {},
    urlConfig: {},
    itemConfig: {},
    customUrlConfig: {},

    //--------------------------------------------------------------------------
    //
    //  Variables
    //
    //--------------------------------------------------------------------------

    _commonUrlItems: ["appid", "group", "oauthappid", "webmap", "webscene"],

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function () {
      // convert text to JSON
      var boilerplateConfigJSON = JSON.parse(boilerplateConfig);
      var applicationConfigJSON = JSON.parse(applicationConfig);
      // template settings
      var boilerplateDefaults = {
        queryForWebmap: true
      };
      // mixin defaults with boilerplate configuration
      this.boilerplateConfig = lang.mixin(boilerplateDefaults, boilerplateConfigJSON);
      // config will contain application and user defined info for the application such as the web scene id and application id, any url parameters and any application specific configuration information.
      this.config = applicationConfigJSON;
      // Gets parameters from the URL, convert them to an object and remove HTML tags.
      this.urlObject = this._createUrlParamsObject();

      // todo
      this._init().then(this.resolve, this.reject);
      return this.promise;
    },

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    queryWebsceneItem: function(){

    },

    queryWebmapItem: function(){

    },

    queryGroupInfo: function(){

    },

    queryGroupItems: function(){

    },

    // todo: rename to queryWebscene. Have a function for getting group, webscene, or webmap.
    queryItem: function () {
      var deferred, cfg = {};
      // Get details about the specified web scene. If the web scene is not shared publicly users will
      // be prompted to log-in by the Identity Manager.
      deferred = new Deferred();
      // Use local web scene instead of portal web scene
      if (this.boilerplateConfig.useLocalWebScene) {
        // get web scene js file
        require(["dojo/text!./demoScene.json"], function (data) {
          // return web scene json
          cfg.itemInfo = JSON.parse(data);
          this.itemConfig = cfg;
          deferred.resolve(cfg);
        }.bind(this));
      }
      // no web scene is set and we have organization's info
      else if (!this.config.webscene && this.config.orgInfo) {
        var defaultWebScene = {
          "item": {
            "title": "Default Webscene",
            "type": "Web Scene",
            "description": "A web scene with the default basemap and extent.",
            "snippet": "A web scene with the default basemap and extent.",
            "extent": this.config.orgInfo.defaultExtent
          },
          "itemData": {
            "operationalLayers": [],
            "baseMap": this.config.orgInfo.defaultBasemap
          }
        };
        cfg.itemInfo = defaultWebScene;
        this.itemConfig = cfg;
        deferred.resolve(cfg);
      }
      // use webscene from id
      else {
        // todo: this should query the portal item data
        deferred.resolve(cfg);
      }
      return deferred.promise;
    },

    queryApplication: function () {
      // Get the application configuration details using the application id. When the response contains
      // itemData.values then we know the app contains configuration information. We'll use these values
      // to overwrite the application defaults.
      var deferred = new Deferred();
      if (this.config.appid) {

        var sceneItem = new PortalItem({
          id: this.config.appid
        }).load();
        sceneItem.then(function (itemData) {
          var cfg = {};
          if (itemData && itemData.values) {
            // get app config values - we'll merge them with config later.
            cfg = itemData.values;
            // save response
            cfg.appResponse = itemData;
          }

          // todo: (No support yet for app proxies in the scene)
          this.appConfig = cfg;
          deferred.resolve(cfg);
        }.bind(this), function (error) {
          if (!error) {
            error = new Error("Error retrieving application configuration.");
          }
          deferred.reject(error);
        });
      }
      else {
        deferred.resolve();
      }
      return deferred.promise;
    },

    queryOrganization: function () {
      var deferred = new Deferred();
      if (this.boilerplateConfig.queryForOrg) {
        // Query the ArcGIS.com organization. This is defined by the sharinghost that is specified. For example if you
        // are a member of an org you'll want to set the sharinghost to be http://<your org name>.arcgis.com. We query
        // the organization by making a self request to the org url which returns details specific to that organization.
        // Examples of the type of information returned are custom roles, units settings, helper services and more.
        // If this fails, the application will continue to function
        var portal = new Portal().load();
        portal.then(function (response) {
          if (this.boilerplateConfig.webTierSecurity) {
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
          // save organization information
          cfg.orgInfo = response;
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
          this.orgConfig = cfg;
          deferred.resolve(cfg);
        }.bind(this), function (error) {
          if (!error) {
            error = new Error("Error retrieving organization information.");
          }
          deferred.reject(error);
        });
      }
      else {
        deferred.resolve();
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
      var deferred;
      deferred = new Deferred();
      // Set the web scene and appid if they exist but ignore other url params.
      // Additional url parameters may be defined by the application but they need to be mixed in
      // to the config object after we retrieve the application configuration info. As an example,
      // we'll mix in some commonly used url parameters after
      // the application configuration has been applied so that the url parameters overwrite any
      // configured settings. It's up to the application developer to update the application to take
      // advantage of these parameters.
      this.urlConfig = this._getUrlParamValues(this._commonUrlItems);
      // This demonstrates how to handle additional custom url parameters. For example
      // if you want users to be able to specify lat/lon coordinates that define the map's center or
      // specify an alternate basemap via a url parameter.
      // If these options are also configurable these updates need to be added after any
      // application default and configuration info has been applied. Currently these values
      // (center, basemap, theme) are only here as examples and can be removed if you don't plan on
      // supporting additional url parameters in your application.
      this.customUrlConfig = this._getUrlParamValues(this.boilerplateConfig.urlItems);
      // config defaults <- standard url params
      // we need the web scene, appid,and oauthappid to query for the data
      this._mixinAll();
      // Define the sharing url and other default values like the proxy.
      // The sharing url defines where to search for the web map and application content. The
      // default value is arcgis.com.
      this._initializeApplication();
      // check if signed in. Once we know if we're signed in, we can get appConfig, orgConfig and create a portal if needed.
      this._checkSignIn().always(function () {
        // execute these tasks async
        promiseList({
          // get application data
          app: this.queryApplication(),
          // get org data
          org: this.queryOrganization()
        }).always(function () {
          // mixin all new settings from org and app
          this._mixinAll();
          // then execute these async
          promiseList({
            // webscene item
            item: this.queryItem(),
          }).then(function () {
            // mixin all new settings from item.
            this._mixinAll();
            // We have all we need, let's set up a few things
            this._completeApplication();
            deferred.resolve(this);
          }.bind(this));
        }.bind(this));
      }.bind(this));
      // return promise
      return deferred.promise;
    },

    _completeApplication: function () {
      // ArcGIS.com allows you to set an application extent on the application item. Overwrite the
      // existing web map extent with the application item extent when set.
      if (this.config.appid && this.config.application_extent && this.config.application_extent.length > 0 && this.config.itemInfo && this.config.itemInfo.item && this.config.itemInfo.item.extent) {
        this.config.itemInfo.item.extent = [
          [
            parseFloat(this.config.application_extent[0][0]), parseFloat(this.config.application_extent[0][1])
          ],
          [
            parseFloat(this.config.application_extent[1][0]), parseFloat(this.config.application_extent[1][1])
          ]
        ];
      }
      // todo: do we need geometry service for scene? if so do we have config option to set geom service at 4?
    },

    _mixinAll: function () {
      /*
      mix in all the settings we got!
      config <- organization <- application <- group/webmap/webscene <- custom url params <- standard url params
      */
      lang.mixin(this.config, this.orgConfig, this.appConfig, this.itemConfig, this.customUrlConfig, this.urlConfig);
    },

    _getUrlParamValues: function (items) {
      // retrieves only the items specified from the URL object.
      var urlObject = this.urlObject;
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
      if (this.boilerplateConfig.esriEnvironment) {
        var appLocation, instance;
        // Check to see if the app is hosted or a portal. If the app is hosted or a portal set the
        // sharing url and the proxy. Otherwise use the sharing url set it to arcgis.com.
        // We know app is hosted (or portal) if it has /apps/ or /home/ in the url.
        appLocation = location.pathname.indexOf("/apps/");
        if (appLocation === -1) {
          appLocation = location.pathname.indexOf("/home/");
        }
        // app is hosted and no sharing url is defined so let's figure it out.
        if (appLocation !== -1) {
          // hosted or portal
          instance = location.pathname.substr(0, appLocation); //get the portal instance name
          this.config.sharinghost = location.protocol + "//" + location.host + instance;
          this.config.proxyurl = location.protocol + "//" + location.host + instance + "/sharing/proxy";
        }
      }
      esriConfig.portalUrl = this.config.sharinghost;
      // Define the proxy url for the app
      if (this.config.proxyurl) {
        esriConfig.request.proxyUrl = this.config.proxyurl;
      }
    },

    _checkSignIn: function () {
      var deferred, signedIn, oAuthInfo;
      deferred = new Deferred();
      //If there's an oauth appid specified register it
      if (this.config.oauthappid) {
        oAuthInfo = new OAuthInfo({
          appId: this.config.oauthappid,
          portalUrl: this.config.sharinghost,
          popup: true
        });
        IdentityManager.registerOAuthInfos([oAuthInfo]);
      }
      // check sign-in status
      signedIn = IdentityManager.checkSignInStatus(this.config.sharinghost + SHARING_PATH);
      // resolve regardless of signed in or not.
      signedIn.always(function () {
        deferred.resolve();
      });
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
