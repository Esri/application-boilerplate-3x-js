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

  "dojo/i18n!./nls/resources",

  "dojo/_base/declare",

  "dojo/dom",
  "dojo/dom-attr",
  "dojo/dom-class",

  "esri/views/MapView",

  "esri/WebMap",

  "dojo/domReady!"

], function (
  i18n,
  declare,
  dom, domAttr, domClass,
  MapView,
  WebMap
) {

  //--------------------------------------------------------------------------
  //
  //  Static Variables
  //
  //--------------------------------------------------------------------------

  var CSS = {
    loading: "boilerplate--loading",
    error: "boilerplate--error"
  };

  return declare(null, {

    //--------------------------------------------------------------------------
    //
    //  Variables
    //
    //--------------------------------------------------------------------------

    boilerplateResults: null,

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
        this.boilerplateResults = boilerplate.results;
        document.documentElement.lang = boilerplate.locale;
        this._setDirection();
        this._createWebmap();
      }
      else {
        var error = new Error("main:: Config is not defined");
        this.reportError(error);
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
        node.innerHTML = "<h1><span class=\"" + CSS.errorIcon + "\"></span> " + i18n.error + "</h1><p>" + i18n.webmap.error + ": " + error.message + "</p>";
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

    // create a scene based on the input web scene id
    _createWebmap: function () {
      var webmap, webmapItem = this.boilerplateResults.webmapItem;

      if (!webmapItem) {
        var error = new Error("main:: webmap data does not exist.");
        this.reportError(error);
        return;
      }

      if (webmapItem.data) {
        webmap = new WebMap({
          portalItem: webmapItem.data
        });
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
        var view = new MapView(viewProperties);
        view.then(function (response) {
          domClass.remove(document.body, CSS.loading);
          document.title = this.config.title;
        }.bind(this), this.reportError);
      }
    }

  });
});
