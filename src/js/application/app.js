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

  "boilerplate/ItemHelper",

  "boilerplate/UrlParamHelper",

  "dojo/i18n!./nls/resources",

  "dojo/_base/declare",
  "dojo/_base/lang",

  "dojo/dom",
  "dojo/dom-attr",
  "dojo/dom-class",

  "dojo/domReady!"

], function(
  ItemHelper, UrlParamHelper,
  i18n,
  declare, lang,
  dom, domAttr, domClass
) {

  //--------------------------------------------------------------------------
  //
  //  Static Variables
  //
  //--------------------------------------------------------------------------

  var CSS = {
    loading: "boilerplate--loading",
    error: "boilerplate--error",
    errorIcon: "esri-icon-notice-round"
  };

  return declare(null, {

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function() {},

    //--------------------------------------------------------------------------
    //
    //  Variables
    //
    //--------------------------------------------------------------------------

    config: null,

    direction: null,

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    init: function(boilerplateResponse) {
      if (boilerplateResponse) {
        this.direction = boilerplateResponse.direction;
        this.config = boilerplateResponse.config;
        this.settings = boilerplateResponse.settings;
        var boilerplateResults = boilerplateResponse.results;
        var webMapItem = boilerplateResults.webMapItem;
        var webSceneItem = boilerplateResults.webSceneItem;
        var groupData = boilerplateResults.group;

        document.documentElement.lang = boilerplateResponse.locale;

        this.urlParamHelper = new UrlParamHelper();
        this.itemHelper = new ItemHelper();

        this._setDirection();

        if (webMapItem) {
          this._createWebMap(webMapItem);
        } else if (webSceneItem) {
          this._createWebScene(webSceneItem);
        } else if (groupData) {
          this._createGroupGallery(groupData);
        } else {
          this.reportError(new Error("app:: Could not load an item to display"));
        }
      } else {
        this.reportError(new Error("app:: Boilerplate is not defined"));
      }
    },

    reportError: function(error) {
      // remove loading class from body
      domClass.remove(document.body, CSS.loading);
      domClass.add(document.body, CSS.error);
      // an error occurred - notify the user. In this example we pull the string from the
      // resource.js file located in the nls folder because we've set the application up
      // for localization. If you don't need to support multiple languages you can hardcode the
      // strings here and comment out the call in index.html to get the localization strings.
      // set message
      var node = dom.byId("loading_message");
      if (node) {
        node.innerHTML = "<h1><span class=\"" + CSS.errorIcon + "\"></span> " + i18n.error + "</h1><p>" + error.message + "</p>";
      }
      return error;
    },

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _setDirection: function() {
      var direction = this.direction;
      var dirNode = document.getElementsByTagName("html")[0];
      domAttr.set(dirNode, "dir", direction);
    },

    _ready: function() {
      domClass.remove(document.body, CSS.loading);
      document.title = this.config.title;
    },

    _createWebMap: function(webMapItem) {
      this.itemHelper.createWebMap(webMapItem).then(function(map) {

        var viewProperties = {
          map: map,
          container: this.settings.webmap.containerId
        };

        if (!this.config.title && map.portalItem && map.portalItem.title) {
          this.config.title = map.portalItem.title;
        }

        lang.mixin(viewProperties, this.urlParamHelper.getViewProperties(this.config));

        require(["esri/views/MapView"], function(MapView) {

          var view = new MapView(viewProperties);

          view.then(function(response) {
            this.urlParamHelper.addToView(view, this.config);

            this._ready();

          }.bind(this), this.reportError);

        }.bind(this));

      }.bind(this), this.reportError);
    },

    _createWebScene: function(webSceneItem) {
      this.itemHelper.createWebScene(webSceneItem).then(function(map) {

        var viewProperties = {
          map: map,
          container: this.settings.webscene.containerId
        };

        if (!this.config.title && map.portalItem && map.portalItem.title) {
          this.config.title = map.portalItem.title;
        }

        lang.mixin(viewProperties, this.urlParamHelper.getViewProperties(this.config));

        require(["esri/views/SceneView"], function(SceneView) {

          var view = new SceneView(viewProperties);

          view.then(function(response) {

            this.urlParamHelper.addToView(view, this.config);

            this._ready();

          }.bind(this), this.reportError);

        }.bind(this));

      }.bind(this), this.reportError);
    },

    _createGroupGallery: function(groupData) {
      var groupInfoData = groupData.infoData;
      var groupItemsData = groupData.itemsData;

      if (!groupInfoData || !groupItemsData || groupInfoData.total === 0 || groupInfoData instanceof Error) {
        this.reportError(new Error("app:: group data does not exist."));
        return;
      }

      var info = groupInfoData.results[0];
      var items = groupItemsData.results;

      this._ready();

      if (info && items) {
        var html = "";

        html += "<h1>" + info.title + "</h1>";

        html += "<ol>";

        items.forEach(function(item) {
          html += "<li>" + item.title + "</li>";
        });

        html += "</ol>";

        document.body.innerHTML = html;
      }

    }

  });
});
