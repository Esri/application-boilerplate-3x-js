/*global define,document */
/*jslint sloppy:true,nomen:true */
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
define([
  "dojo/_base/declare",
  "dojo/_base/lang",

  "dojo/Deferred",

  "dojo/dom",
  "dojo/dom-class",

  "esri/arcgis/utils",

  "application/MapUrlParams",

  "dojo/domReady!"
], function (
  declare, lang,
  Deferred,
  dom, domClass,
  arcgisUtils,
  MapUrlParams
) {
  return declare(null, {
    config: {},
    startup: function (config) {
      var promise;
      // config will contain application and user defined info for the template such as i18n strings, the web map id
      // and application id
      // any url parameters and any application specific configuration information.
      if (config) {
        this.config = config;
        //supply either the webmap id or, if available, the item info
        var itemInfo = this.config.itemInfo || this.config.webmap;


        // Check for center, extent, level and marker url parameters.
        var mapParams = new MapUrlParams({
          center: this.config.center || null,
          extent: this.config.extent || null,
          level: this.config.level || null,
          marker: this.config.marker || null,
          mapSpatialReference: itemInfo.itemData.spatialReference,
          defaultMarkerSymbol: this.config.markerSymbol,
          defaultMarkerSymbolWidth: this.config.markerSymbolWidth,
          defaultMarkerSymbolHeight: this.config.markerSymbolHeight,
          geometryService: this.config.helperServices.geometry.url
        });

        mapParams.processUrlParams().then(lang.hitch(this, function(urlParams){
          promise = this._createWebMap(itemInfo, urlParams);
        }), lang.hitch(this, function(error){
          this.reportError(error);
        }));

      } else {
        var error = new Error("Main:: Config is not defined");
        this.reportError(error);
        var def = new Deferred();
        def.reject(error);
        promise = def.promise;
      }
      return promise;
    },
    reportError: function (error) {
      // remove loading class from body
      domClass.remove(document.body, "app-loading");
      domClass.add(document.body, "app-error");
      // an error occurred - notify the user. In this example we pull the string from the
      // resource.js file located in the nls folder because we've set the application up
      // for localization. If you don't need to support multiple languages you can hardcode the
      // strings here and comment out the call in index.html to get the localization strings.
      // set message
      var node = dom.byId("loading_message");
      if (node) {
        if (this.config && this.config.i18n) {
          node.innerHTML = this.config.i18n.map.error + ": " + error.message;
        } else {
          node.innerHTML = "Unable to create map: " + error.message;
        }
      }
      return error;
    },

    // create a map based on the input web map id
    _createWebMap: function (itemInfo, params) {
      // Optionally define additional map config here for example you can
      // turn the slider off, display info windows, disable wraparound 180,
      // slider position and more.
      return arcgisUtils.createMap(itemInfo, "mapDiv", {
        mapOptions: params.mapOptions || {},
        usePopupManager: true,
        layerMixins: this.config.layerMixins || [],
        editable: this.config.editable,
        bingMapsKey: this.config.bingKey
      }).then(lang.hitch(this, function (response) {
        // Once the map is created we get access to the response which provides important info
        // such as the map, operational layers, popup info and more. This object will also contain
        // any custom options you defined for the template. In this example that is the 'theme' property.
        // Here' we'll use it to update the application to match the specified color theme.
        // console.log(this.config);
        this.map = response.map;
        // remove loading class from body
        domClass.remove(document.body, "app-loading");
        // Start writing code
        /* ---------------------------------------- */
        /*  Map is ready. Start writing code        */
        /* ---------------------------------------- */
        console.log("Hello World!");
        console.log("My Map:", this.map);
        console.log("My Config:", this.config);


          if(params.markerGraphic){
            // Add a marker graphic with an optional info window if
            // one was specified via the marker url parameter
            require(["esri/layers/GraphicsLayer"], lang.hitch(this, function(GraphicsLayer){
              var markerLayer = new GraphicsLayer();

              this.map.addLayer(markerLayer);
              markerLayer.add(params.markerGraphic);

              if(params.markerGraphic.infoTemplate){
                this.map.infoWindow.setFeatures([params.markerGraphic]);
                this.map.infoWindow.show(params.markerGraphic.geometry);
              }

              this.map.centerAt(params.markerGraphic.geometry);
            }));

          }

        /* ---------------------------------------- */
        /*                                          */
        /* ---------------------------------------- */
        // return for promise
        return response;
        // map has been created. You can start using it.
        // If you need map to be loaded, listen for it's load event.
      }), this.reportError);
    }

  });
});
