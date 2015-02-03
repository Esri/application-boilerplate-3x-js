/*
  Version 1.4
  2/3/2015
*/

/*global define,document,location,require */
/*jslint sloppy:true,nomen:true,plusplus:true */
/*
 | Copyright 2014 Esri
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
define(["dojo/Evented", "dojo/_base/declare", "dojo/_base/kernel", "dojo/_base/array", "dojo/_base/lang", "dojo/dom-class", "dojo/Deferred", "dojo/promise/all", "esri/arcgis/utils", "esri/urlUtils", "esri/request", "esri/config", "esri/lang", "esri/IdentityManager", "esri/arcgis/Portal", "esri/arcgis/OAuthInfo", "esri/tasks/GeometryService", "config/defaults", "dojo/string"], function (
  Evented,
  declare,
  kernel,
  array,
  lang,
  domClass,
  Deferred,
  all,
  arcgisUtils,
  urlUtils,
  esriRequest,
  esriConfig,
  esriLang,
  IdentityManager,
  esriPortal,
  ArcGISOAuthInfo,
  GeometryService,
  defaults,
  string
) {
  return declare([Evented], {
    config: {},
    orgConfig: {},
    appConfig: {},
    urlConfig: {},
    i18nConfig: {},
    groupItemConfig: {},
    groupInfoConfig: {},
    itemConfig: {},
    customUrlConfig: {},
    commonUrlItems: ["webmap", "appid", "group", "oauthappid"],
    constructor: function (templateConfig) {
      // template settings
      var defaultTemplateConfig = {
        queryForWebmap: true
      };
      this.templateConfig = lang.mixin(defaultTemplateConfig, templateConfig);
      // config will contain application and user defined info for the application such as i18n strings the web map id and application id, any url parameters and any application specific configuration information.
      this.config = defaults;
      // Gets parameters from the URL, convert them to an object and remove HTML tags.
      this.urlObject = this._createUrlParamsObject();
    },
    startup: function () {
      var promise = this._init();
      promise.then(lang.hitch(this, function (config) {
        // optional ready event to listen to
        this.emit("ready", config);
      }), lang.hitch(this, function (error) {
        // optional error event to listen to
        this.emit("error", error);
      }));
      return promise;
    },
    // Get URL parameters and set application defaults needed to query arcgis.com for
    // an application and to see if the app is running in Portal or an Org
    _init: function () {
      var deferred;
      deferred = new Deferred();
      // Set the web map, group and appid if they exist but ignore other url params.
      // Additional url parameters may be defined by the application but they need to be mixed in
      // to the config object after we retrieve the application configuration info. As an example,
      // we'll mix in some commonly used url parameters after
      // the application configuration has been applied so that the url parameters overwrite any
      // configured settings. It's up to the application developer to update the application to take
      // advantage of these parameters.
      this.urlConfig = this._getUrlParamValues(this.commonUrlItems);
      // This demonstrates how to handle additional custom url parameters. For example
      // if you want users to be able to specify lat/lon coordinates that define the map's center or
      // specify an alternate basemap via a url parameter.
      // If these options are also configurable these updates need to be added after any
      // application default and configuration info has been applied. Currently these values
      // (center, basemap, theme) are only here as examples and can be removed if you don't plan on
      // supporting additional url parameters in your application.
      this.customUrlConfig = this._getUrlParamValues(this.templateConfig.urlItems);
      // config defaults <- standard url params
      // we need the webmap, appid, group and oauthappid to query for the data
      this._mixinAll();
      // Define the sharing url and other default values like the proxy.
      // The sharing url defines where to search for the web map and application content. The
      // default value is arcgis.com.
      this._initializeApplication();
      // check if signed in. Once we know if we're signed in, we can get appConfig, orgConfig and create a portal if needed.
      this._checkSignIn().always(lang.hitch(this, function () {
        // execute these tasks async
        all({
          // get localization
          i18n: this._queryLocalization(),
          // get application data
          app: this.queryApplication(),
          // creates a portal for the app if necessary (groups use them)
          portal: this._createPortal(),
          // get org data
          org: this.queryOrganization()
        }).then(lang.hitch(this, function () {
          // mixin all new settings from org and app
          this._mixinAll();
          // then execute these async
          all({
            // webmap item
            item: this.queryItem(),
            // group information
            groupInfo: this.queryGroupInfo(),
            // group items
            groupItems: this.queryGroupItems(),
          }).then(lang.hitch(this, function () {
            // mixin all new settings from item, group info and group items.
            this._mixinAll();
            // We have all we need, let's set up a few things
            this._completeApplication();
            deferred.resolve(this.config);
          }), deferred.reject);
        }), deferred.reject);
      }));
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
      // Set the geometry helper service to be the app default.
      if (this.config.helperServices && this.config.helperServices.geometry && this.config.helperServices.geometry.url) {
        esriConfig.defaults.geometryService = new GeometryService(this.config.helperServices.geometry.url);
      }
    },
    _mixinAll: function () {
      /*
      mix in all the settings we got!
      {} <- i18n <- organization <- application <- group info <- group items <- webmap <- custom url params <- standard url params.
      */
      lang.mixin(this.config, this.i18nConfig, this.orgConfig, this.appConfig, this.groupInfoConfig, this.groupItemConfig, this.itemConfig, this.customUrlConfig, this.urlConfig);
    },
    _createPortal: function () {
      var deferred = new Deferred();
      if (this.templateConfig.queryForGroupInfo || this.templateConfig.queryForGroupItems) {
        this.portal = new esriPortal.Portal(this.config.sharinghost);
        this.portal.on("load", function () {
          deferred.resolve();
        });
      } else {
        deferred.resolve();
      }
      return deferred.promise;
    },
    _getUrlParamValues: function (items) {
      // retreives only the items specified from the URL object.
      var urlObject = this.urlObject,
        obj = {},
        i;
      if (urlObject && urlObject.query && items && items.length) {
        for (i = 0; i < items.length; i++) {
          if (urlObject.query[items[i]]) {
            obj[items[i]] = urlObject.query[items[i]];
          }
        }
      }
      return obj;
    },
    _createUrlParamsObject: function () {
      var urlObject,
        url;
      // retrieve url parameters. Templates all use url parameters to determine which arcgis.com
      // resource to work with.
      // Map templates use the webmap param to define the webmap to display
      // Group templates use the group param to provide the id of the group to display.
      // appid is the id of the application based on the template. We use this
      // id to retrieve application specific configuration information. The configuration
      // information will contain the values the  user selected on the template configuration
      // panel.
      url = document.location.href;
      urlObject = urlUtils.urlToObject(url);
      urlObject.query = urlObject.query || {};
      // remove any HTML tags from query item
      urlObject.query = esriLang.stripTags(urlObject.query);
      return urlObject;
    },
    _initializeApplication: function () {
      // If this app is hosted on an Esri environment.
      if (this.templateConfig.esriEnvironment) {
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
      arcgisUtils.arcgisUrl = this.config.sharinghost + "/sharing/rest/content/items";
      // Define the proxy url for the app
      if (this.config.proxyurl) {
        esriConfig.defaults.io.proxyUrl = this.config.proxyurl;
        esriConfig.defaults.io.alwaysUseProxy = false;
      }
    },
    _checkSignIn: function () {
      var deferred, signedIn, oAuthInfo;
      deferred = new Deferred();
      //If there's an oauth appid specified register it
      if (this.config.oauthappid) {
        oAuthInfo = new ArcGISOAuthInfo({
          appId: this.config.oauthappid,
          portalUrl: this.config.sharinghost,
          popup: true
        });
        IdentityManager.registerOAuthInfos([oAuthInfo]);
      }
      // check sign-in status
      signedIn = IdentityManager.checkSignInStatus(this.config.sharinghost + "/sharing");
      // resolve regardless of signed in or not.
      signedIn.promise.always(function () {
        deferred.resolve();
      });
      return deferred.promise;
    },
    _queryLocalization: function () {
      var deferred, dirNode, classes, rtlClasses;
      deferred = new Deferred();
      if (this.templateConfig.queryForLocale) {
        require(["dojo/i18n!application/nls/resources"], lang.hitch(this, function (appBundle) {
          var cfg = {};
          // Get the localization strings for the template and store in an i18n variable. Also determine if the
          // application is in a right-to-left language like Arabic or Hebrew.
          cfg.i18n = appBundle || {};
          // Bi-directional language support added to support right-to-left languages like Arabic and Hebrew
          // Note: The map must stay ltr
          cfg.i18n.direction = "ltr";
          array.some(["ar", "he"], lang.hitch(this, function (l) {
            if (kernel.locale.indexOf(l) !== -1) {
              cfg.i18n.direction = "rtl";
              return true;
            }
            return false;
          }));
          // add a dir attribute to the html tag. Then you can add special css classes for rtl languages
          dirNode = document.getElementsByTagName("html")[0];
          classes = dirNode.className;
          if (cfg.i18n.direction === "rtl") {
            // need to add support for dj_rtl.
            // if the dir node is set when the app loads dojo will handle.
            dirNode.setAttribute("dir", "rtl");
            rtlClasses = " esriRTL dj_rtl dijitRtl " + classes.replace(/ /g, "-rtl ");
            dirNode.className = lang.trim(classes + rtlClasses);
          } else {
            dirNode.setAttribute("dir", "ltr");
            domClass.add(dirNode, "esriLTR");
          }
          this.i18nConfig = cfg;
          deferred.resolve(cfg);
        }));
      } else {
        deferred.resolve();
      }
      return deferred.promise;
    },
    queryGroupItems: function (options) {
      var deferred = new Deferred(),
        error, defaultParams, params;
      // If we want to get the group info
      if (this.templateConfig.queryForGroupItems) {
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
          params = lang.mixin(defaultParams, this.templateConfig.groupParams, options);
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
    },
    queryGroupInfo: function () {
      var deferred = new Deferred(),
        error, params;
      // If we want to get the group info
      if (this.templateConfig.queryForGroupInfo) {
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
    },
    queryItem: function () {
      var deferred;
      // Get details about the specified web map. If the web map is not shared publicly users will
      // be prompted to log-in by the Identity Manager.
      deferred = new Deferred();
      // If we want to get the webmap
      if (this.templateConfig.queryForWebmap) {
        // if webmap does not exist
        if (!this.config.webmap) {
          // use default webmap for boilerplate
          this.config.webmap = "24e01ef45d40423f95300ad2abc5038a";
        }
        arcgisUtils.getItem(this.config.webmap).then(lang.hitch(this, function (itemInfo) {
          // Set the itemInfo config option. This can be used when calling createMap instead of the webmap id
          var cfg = {};
          cfg.itemInfo = itemInfo;
          this.itemConfig = cfg;
          deferred.resolve(cfg);
        }), function (error) {
          if (!error) {
            error = new Error("Error retrieving display item.");
          }
          deferred.reject(error);
        });
      } else {
        // we're done. we dont need to get the webmap
        deferred.resolve();
      }
      return deferred.promise;
    },
    queryApplication: function () {
      // Get the application configuration details using the application id. When the response contains
      // itemData.values then we know the app contains configuration information. We'll use these values
      // to overwrite the application defaults.
      var deferred = new Deferred();
      if (this.config.appid) {
        arcgisUtils.getItem(this.config.appid).then(lang.hitch(this, function (response) {
          var cfg = {};
          if (response.item && response.itemData && response.itemData.values) {
            // get app config values - we'll merge them with config later.
            cfg = response.itemData.values;
            // save response
            cfg.appResponse = response;
          }
          // get the extent for the application item. This can be used to override the default web map extent
          if (response.item && response.item.extent) {
            cfg.application_extent = response.item.extent;
          }
          this.appConfig = cfg;
          deferred.resolve(cfg);
        }), function (error) {
          if (!error) {
            error = new Error("Error retrieving application configuration.");
          }
          deferred.reject(error);
        });
      } else {
        deferred.resolve();
      }
      return deferred.promise;
    },
    queryOrganization: function () {
      var deferred = new Deferred();
      if (this.templateConfig.queryForOrg) {
        // Query the ArcGIS.com organization. This is defined by the sharinghost that is specified. For example if you
        // are a member of an org you'll want to set the sharinghost to be http://<your org name>.arcgis.com. We query
        // the organization by making a self request to the org url which returns details specific to that organization.
        // Examples of the type of information returned are custom roles, units settings, helper services and more.
        // If this fails, the application will continue to function
        esriRequest({
          url: this.config.sharinghost + "/sharing/rest/portals/self",
          content: {
            "f": "json"
          },
          callbackParamName: "callback"
        }).then(lang.hitch(this, function (response) {
          var cfg = {};
          // save organization information
          cfg.orgInfo = response;
          // get units defined by the org or the org user
          cfg.units = "metric";
          if (response.user && response.user.units) { //user defined units
            cfg.units = response.user.units;
          } else if (response.units) { //org level units
            cfg.units = response.units;
          } else if ((response.user && response.user.region && response.user.region === "US") || (response.user && !response.user.region && response.region === "US") || (response.user && !response.user.region && !response.region) || (!response.user && response.ipCntryCode === "US") || (!response.user && !response.ipCntryCode && kernel.locale === "en-us")) {
            // use feet/miles only for the US and if nothing is set for a user
            cfg.units = "english";
          }
          // Get the helper services (routing, print, locator etc)
          cfg.helperServices = response.helperServices;
          // are any custom roles defined in the organization?
          if (response.user && esriLang.isDefined(response.user.roleId)) {
            if (response.user.privileges) {
              cfg.userPrivileges = response.user.privileges;
            }
          }
          this.orgConfig = cfg;
          deferred.resolve(cfg);
        }), function (error) {
          if (!error) {
            error = new Error("Error retrieving organization information.");
          }
          deferred.reject(error);
        });
      } else {
        deferred.resolve();
      }
      return deferred.promise;
    }
  });
});