/*
 | Copyright 2016 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */
define([

  "dojo/text!config/config.json",

  "dojo/_base/declare",
  "dojo/_base/kernel",
  "dojo/_base/lang",

  "dojo/Deferred",

  "esri/config",

  "esri/core/promiseUtils",

  "esri/identity/IdentityManager",
  "esri/identity/OAuthInfo",

  "esri/portal/Portal",
  "esri/portal/PortalItem",
  "esri/portal/PortalQueryParams"

], function (
  applicationConfig,
  declare, kernel, lang,
  Deferred,
  esriConfig,
  promiseUtils,
  IdentityManager, OAuthInfo,
  Portal, PortalItem, PortalQueryParams
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
    var RTL_LANGS = ["ar", "he"];
    var LTR = "ltr";
    var RTL = "rtl";
    var LOCALSTORAGE_PREFIX = "boilerplate_config_";
    var DEFAULT_URL_PARAM = "default";

    return declare(Deferred, {

      //--------------------------------------------------------------------------
      //
      //  Properties
      //
      //--------------------------------------------------------------------------

      settings: null,

      config: null,

      results: null,

      portal: null,

      direction: null,

      locale: null,

      units: null,

      userPrivileges: null,

      //--------------------------------------------------------------------------
      //
      //  Lifecycle
      //
      //--------------------------------------------------------------------------

      constructor: function (applicationConfigJSON, boilerplateSettings) {
        // mixin defaults with boilerplate configuration
        this.settings = lang.mixin({
          "webscene": {},
          "webmap": {},
          "group": {},
          "portal": {},
          "urlItems": []
        }, boilerplateSettings);
        // config will contain application and user defined info for the application such as the web scene id and application id, any url parameters and any application specific configuration information.
        this.config = applicationConfigJSON;
        // stores results from queries
        this.results = {};
        // initialization
        this._init().always(this.resolve);
      },

      //--------------------------------------------------------------------------
      //
      //  Public Methods
      //
      //--------------------------------------------------------------------------

      queryGroupItems: function (options) {
        var deferred;
        // Get details about the specified web scene. If the web scene is not shared publicly users will
        // be prompted to log-in by the Identity Manager.
        deferred = new Deferred();
        if (!this.settings.group.fetchItems || !this.config.group) {
          deferred.resolve();
        }
        else {
          var defaultParams = {
            query: "group:\"{groupid}\" AND -type:\"Code Attachment\"",
            sortField: "modified",
            sortOrder: "desc",
            num: 9,
            start: 1
          };
          var paramOptions = lang.mixin(defaultParams, this.settings.group.itemParams, options);
          // place group ID
          if (paramOptions.query) {
            paramOptions.query = lang.replace(paramOptions.query, {
              groupid: this.config.group
            });
          }
          // group params
          var params = new PortalQueryParams(paramOptions);
          this.portal.queryItems(params).then(function (response) {
            if (!this.results.group) {
              this.results.group = {};
            }
            this.results.group.itemsData = response;
            deferred.resolve(this.results.group);
          }.bind(this), function (error) {
            if (!error) {
              error = new Error("Boilerplate:: Error retrieving group items.");
            }
            if (!this.results.group) {
              this.results.group = {};
            }
            this.results.group.itemsData = error;
            deferred.reject(error);
          }.bind(this));
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
        // determine boilerplate language properties
        this._setLangProps();
        // check if signed in. Once we know if we're signed in, we can get data and create a portal if needed.
        return this._checkSignIn().always(function () {
          // execute these tasks async
          return promiseUtils.eachAlways([
            // get application data
            this._queryApplicationItem(),
            // get org data
            this._queryPortal()
          ]).always(function () {
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
            ]).always(function () {
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
            }.bind(this));
          }.bind(this));
        }.bind(this));
      },

      _getLocalConfig: function () {
        var appid = this.config.appid;
        if (window.localStorage && appid && this.settings.localConfig.fetch) {
          var lsItem = localStorage.getItem(LOCALSTORAGE_PREFIX + appid);
          if (lsItem) {
            var config = JSON.parse(lsItem);
            if (config) {
              return config;
            }
          }
        }
      },

      _queryWebMapItem: function () {
        var deferred;
        // Get details about the specified web map. If the web map is not shared publicly users will
        // be prompted to log-in by the Identity Manager.
        deferred = new Deferred();
        if (!this.settings.webmap.fetch) {
          deferred.resolve();
        }
        else {
          // Use local web map instead of portal web map
          if (this.settings.webmap.useLocal) {
            // get web map js file
            require(["dojo/text!" + this.settings.webmap.localFile], function (webmapText) {
              // return web scene json
              var json = JSON.parse(webmapText);
              this.results.webMapItem = {
                json: json
              };
              deferred.resolve(this.results.webMapItem);
            }.bind(this));
          }
          // use webmap from id
          else if (this.config.webmap) {
            var mapItem = new PortalItem({
              id: this.config.webmap
            }).load();
            mapItem.then(function (itemData) {
              this.results.webMapItem = {
                data: itemData
              };
              deferred.resolve(this.results.webMapItem);
            }.bind(this), function (error) {
              if (!error) {
                error = new Error("Boilerplate:: Error retrieving webmap item.");
              }
              this.results.webMapItem = {
                data: error
              };
              deferred.reject(error);
            }.bind(this));
          }
          else {
            deferred.resolve();
          }
        }
        return deferred.promise;
      },

      _queryGroupInfo: function () {
        var deferred;
        // Get details about the specified group. If the group is not shared publicly users will
        // be prompted to log-in by the Identity Manager.
        deferred = new Deferred();
        if (!this.settings.group.fetchInfo || !this.config.group) {
          deferred.resolve();
        }
        else {
          // group params
          var params = new PortalQueryParams({
            query: "id:\"" + this.config.group + "\""
          });
          this.portal.queryGroups(params).then(function (response) {
            if (!this.results.group) {
              this.results.group = {};
            }
            this.results.group.infoData = response;
            deferred.resolve(this.results.group);
          }.bind(this), function (error) {
            if (!error) {
              error = new Error("Boilerplate:: Error retrieving group info.");
            }
            if (!this.results.group) {
              this.results.group = {};
            }
            this.results.group.infoData = error;
            deferred.reject(error);
          }.bind(this));
        }
        return deferred.promise;
      },

      _queryWebSceneItem: function () {
        var deferred, sceneItem;
        // Get details about the specified web scene. If the web scene is not shared publicly users will
        // be prompted to log-in by the Identity Manager.
        deferred = new Deferred();
        if (!this.settings.webscene.fetch) {
          deferred.resolve();
        }
        else {
          // Use local web scene instead of portal web scene
          if (this.settings.webscene.useLocal) {
            // get web scene js file
            require(["dojo/text!" + this.settings.webscene.localFile], function (websceneText) {
              // return web scene json
              var json = JSON.parse(websceneText);
              this.results.webSceneItem = {
                json: json
              };
              deferred.resolve(this.results.webSceneItem);
            }.bind(this));
          }
          // use webscene from id
          else if (this.config.webscene) {
            sceneItem = new PortalItem({
              id: this.config.webscene
            }).load();
            sceneItem.then(function (itemData) {
              this.results.webSceneItem = {
                data: itemData
              };
              deferred.resolve(this.results.webSceneItem);
            }.bind(this), function (error) {
              if (!error) {
                error = new Error("Boilerplate:: Error retrieving webscene item.");
              }
              this.results.webSceneItem = {
                data: error
              };
              deferred.reject(error);
            }.bind(this));
          }
          else {
            deferred.resolve();
          }
        }
        return deferred.promise;
      },

      _queryApplicationItem: function () {
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
            itemData.fetchData().then(function (data) {
              var cfg = {};
              if (data && data.values) {
                // get app config values - we'll merge them with config later.
                cfg = data.values;
              }
              // get the extent for the application item. This can be used to override the default web map extent
              if (itemData.extent) {
                cfg.application_extent = itemData.extent;
              }
              // get any app proxies defined on the application item
              if (itemData.appProxies) {
                var layerMixins = itemData.appProxies.map(function (p) {
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
                error = new Error("Boilerplate:: Error retrieving application configuration data.");
              }
              this.results.applicationItem = {
                data: error,
                config: null
              };
              deferred.reject(error);
            }.bind(this));

          }.bind(this), function (error) {
            if (!error) {
              error = new Error("Boilerplate:: Error retrieving application configuration.");
            }
            this.results.applicationItem = {
              data: error,
              config: null
            };
            deferred.reject(error);
          }.bind(this));
        }
        return deferred.promise;
      },

      _queryPortal: function () {
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
            // set boilerplate units
            var units = "metric";
            if (response.user && response.user.units) { //user defined units
              units = response.user.units;
            }
            else if (response.units) { //org level units
              units = response.units;
            }
            else if ((response.user && response.user.region && response.user.region === "US") || (response.user && !response.user.region && response.region === "US") || (response.user && !response.user.region && !response.region) || (!response.user && response.ipCntryCode === "US") || (!response.user && !response.ipCntryCode && kernel.locale === "en-us")) {
              // use feet/miles only for the US and if nothing is set for a user
              units = "english";
            }
            this.units = units;
            // are any custom roles defined in the organization?
            if (response.user && this._isDefined(response.user.roleId)) {
              if (response.user.privileges) {
                this.userPrivileges = response.user.privileges;
              }
            }
            // set data for portal on boilerplate
            this.results.portal = {
              data: response
            };
            deferred.resolve(this.results.portal);
          }.bind(this), function (error) {
            if (!error) {
              error = new Error("Boilerplate:: Error retrieving organization information.");
            }
            this.results.portal = {
              data: error
            };
            deferred.reject(error);
          }.bind(this));
        }
        return deferred.promise;
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
        var applicationExtent = this.config.application_extent;
        var results = this.results;
        if (this.config.appid && applicationExtent && applicationExtent.length > 0) {
          this._overwriteExtent(results.webSceneItem.data, applicationExtent);
          this._overwriteExtent(results.webMapItem.data, applicationExtent);
        }
        // get helper services
        var configHelperServices = this.config.helperServices;
        var portalHelperServices = this.portal && this.portal.helperServices;
        // see if config has a geometry service
        var configGeometryUrl = configHelperServices && configHelperServices.geometry && configHelperServices.geometry.url;
        // seee if portal has a geometry service
        var portalGeometryUrl = portalHelperServices && portalHelperServices.geometry && portalHelperServices.geometry.url;
        // use the portal geometry service or config geometry service
        var geometryUrl = portalGeometryUrl || configGeometryUrl;
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
      },

      // determine appropriate language direction for the application
      _setLangProps: function () {
        var direction = LTR;
        RTL_LANGS.forEach(function (l) {
          if (kernel.locale.indexOf(l) !== -1) {
            direction = RTL;
          }
        });
        // set boilerplate language direction
        this.direction = direction;
        // set boilerplate langauge locale
        this.locale = kernel.locale;
      },

      _mixinAllConfigs: function () {
        /*
        mix in all the settings we got!
        config <- application settings <- url params
        */
        lang.mixin(
          this.config,
          this.results.applicationItem ? this.results.applicationItem.config : null,
          this.results.localStorageConfig,
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
            this.config.portalUrl = "https://" + location.host + instance;
            this.config.proxyUrl = "https://" + location.host + instance + ESRI_PROXY_PATH;
          }
        }
        esriConfig.portalUrl = this.config.portalUrl;
        // Define the proxy url for the app
        if (this.config.proxyUrl) {
          esriConfig.request.proxyUrl = this.config.proxyUrl;
        }
      },

      // check if user is signed into a portal
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

      // helper function for determining if a value is defined
      _isDefined: function (value) {
        return (value !== undefined) && (value !== null);
      },

      // remove HTML tags from values
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
              if (data[item]) {
                var currentItem = data[item];
                if (typeof currentItem === "string") {
                  //strip html tags
                  currentItem = currentItem.replace(TAGS_RE, "");
                }
                // set item back on data
                data[item] = currentItem;
              }
            }
          }
        }
        return data;
      },

      // capture all url params to an object with values
      _urlToObject: function () {
        var query = (window.location.search || "?").substr(1),
          map = {};
        query.replace(URL_RE, function (match, key, value) {
          map[key] = decodeURIComponent(value);
        });
        return map;
      }
    });
  });
