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

  "boilerplate/UrlParamHelper",

  "dojo/i18n!./nls/resources",

  "dojo/_base/declare",
  "dojo/_base/lang",

  "dojo/dom",
  "dojo/dom-attr",
  "dojo/dom-class",

  "esri/views/SceneView",

  "esri/WebScene",

  "esri/views/MapView",

  "esri/WebMap",

  "application/main",

  "dojo/domReady!"

], function (
  UrlParamHelper,
  i18n,
  declare, lang,
  dom, domAttr, domClass,
  SceneView,
  WebScene,
  MapView,
  WebMap,
  Main
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

    init: function (boilerplate) {
      if (boilerplate) {
        this.direction = boilerplate.direction;
        this.config = boilerplate.config;
        var boilerplateResults = boilerplate.results;
        var webmapItem = boilerplateResults.webmapItem;
        var websceneItem = boilerplateResults.websceneItem;
        var groupData = boilerplateResults.group;

        document.documentElement.lang = boilerplate.locale;

        this.urlParamHelper = new UrlParamHelper();

        this.main = new Main();

        // Does the app want to adjust the configuration?
        if (this.main.adjustConfig) {
          this.main.adjustConfig(this.config);
        }

        this._setDirection();

        if (webmapItem) {
          this._createWebmap(webmapItem);
        }
        else if (websceneItem) {
          this._createWebscene(websceneItem);
        }
        else if (groupData) {
          this._createGroupGallery(groupData);
        }
        else {
          this.reportError(new Error("main:: Could not load an item to display"));
        }
      }
      else {
        this.reportError(new Error("main:: Config is not defined"));
      }
    },

    reportError: function (error) {
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
        // Does the app want to handle the report?
        if (this.main.reportError) {
          this.main.reportError(node, error);
        } else {
          node.innerHTML = "<h1><span class=\"" + CSS.errorIcon + "\"></span> " + i18n.error + "</h1><p>" + error.message + "</p>";
        }
      }
      return error;
    },

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _setDirection: function () {
      var direction = this.direction;
      var dirNode = document.getElementsByTagName("html")[0];
      domAttr.set(dirNode, "dir", direction);
    },

    _createWebmap: function (webmapItem) {
      var webmap;

      if (!webmapItem) {
        var error = new Error("main:: webmap data does not exist.");
        this.reportError(error);
        return;
      }

      if (webmapItem.data) {
        if (webmapItem.data instanceof Error) {
          this.reportError(webmapItem.data);
        }
        else {
          webmap = new WebMap({
            portalItem: webmapItem.data
          });
        }
      }
      else if (webmapItem.json) {
        webmap = WebMap.fromJSON(webmapItem.json.itemData);
        webmap.portalItem = webmapItem.json.item;
      }
      if (webmap) {
        var viewProperties = {
          map: webmap,
          container: "viewDiv"
        };
        if (!this.config.title && webmap.portalItem && webmap.portalItem.title) {
          this.config.title = webmap.portalItem.title;
        }
        lang.mixin(viewProperties, this.urlParamHelper.getViewProperties(this.config));

        var view = new MapView(viewProperties);
        view.then(function (response) {
          this.urlParamHelper.addToView(view, this.config);

          domClass.remove(document.body, CSS.loading);
          document.title = this.config.title;

          // Launch the app specifics
          this.main.runMap(this.config, webmap, view);
        }.bind(this), this.reportError);
      }
    },

    _createWebscene: function (websceneItem) {
      var webscene;
      if (!websceneItem) {
        var error = new Error("main:: webscene data does not exist.");
        this.reportError(error);
        return;
      }
      if (websceneItem.data) {
        if (websceneItem.data instanceof Error) {
          this.reportError(websceneItem.data);
        }
        else {
          webscene = new WebScene({
            portalItem: websceneItem.data
          });
        }
      }
      else if (websceneItem.json) {
        webscene = WebScene.fromJSON(websceneItem.json.itemData);
        webscene.portalItem = websceneItem.json.item;
      }
      if (webscene) {
        var viewProperties = {
          map: webscene,
          container: "viewDiv"
        };

        if (!this.config.title && webscene.portalItem && webscene.portalItem.title) {
          this.config.title = webscene.portalItem.title;
        }

        lang.mixin(viewProperties, this.urlParamHelper.getViewProperties(this.config));

        var view = new SceneView(viewProperties);

        view.then(function (response) {

          this.urlParamHelper.addToView(view, this.config);

          domClass.remove(document.body, CSS.loading);
          document.title = this.config.title;

          // Launch the app specifics
          this.main.runMap(this.config, webscene, view);
        }.bind(this), this.reportError);
      }
    },

    _createGroupGallery: function (groupData) {
      var groupInfoData = groupData.infoData;
      var groupItemsData = groupData.itemsData;

      if (!groupInfoData || !groupItemsData || groupInfoData.total === 0 || groupInfoData instanceof Error) {
        this.reportError(new Error("main:: group data does not exist."));
        return;
      }

      var info = groupInfoData.results[0];
      var items = groupItemsData.results;

      domClass.remove(document.body, CSS.loading);
      document.title = this.config.title;

      // Launch the app specifics
      this.main.runGroup(this.config, dom.byId("viewDiv"), info, items);
    }

  });
});
