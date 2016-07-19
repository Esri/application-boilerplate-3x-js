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

  "boilerplate/UrlHelper",

  "dojo/i18n!./nls/resources",

  "dojo/_base/declare",

  "dojo/dom",
  "dojo/dom-attr",
  "dojo/dom-class",

  "esri/views/SceneView",

  "esri/WebScene",

  "dojo/domReady!"

], function (
  UrlHelper,
  i18n,
  declare,
  dom, domAttr, domClass,
  SceneView,
  WebScene
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

  return declare([UrlHelper], {

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
        this._createWebscene();
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
        node.innerHTML = "<h1><span class=\"" + CSS.errorIcon + "\"></span> " + i18n.error + "</h1><p>" + i18n.scene.error + ": " + error.message + "</p>";
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

    _createWebscene: function () {
      var webscene, websceneItem = this.boilerplateResults.websceneItem;
      if (!websceneItem) {
        var error = new Error("main:: webscene data does not exist.");
        this.reportError(error);
        return;
      }
      if (websceneItem.data) {
        webscene = new WebScene({
          portalItem: websceneItem.data
        });
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
        if (this.config.components) {
          viewProperties.ui = {
            components: this.config.components.split(",")
          };
        }
        var camera = this.cameraFromViewpoint(this.config.viewpoint);
        if (camera) {
          viewProperties.camera = camera;
        }
        if (!this.config.title && webscene.portalItem && webscene.portalItem.title) {
          this.config.title = webscene.portalItem.title;
        }
        var view = new SceneView(viewProperties);
        view.then(function (response) {
          domClass.remove(document.body, CSS.loading);
          document.title = this.config.title;
        }.bind(this), this.reportError);
      }
    }

  });
});
