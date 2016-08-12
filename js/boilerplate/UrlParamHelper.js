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

  "dojo/_base/declare",

  "esri/Camera",

  "esri/geometry/Extent",
  "esri/geometry/Point",

  "require"

], function (
  declare,
  Camera,
  Extent, Point,
  require
) {

  //--------------------------------------------------------------------------
  //
  //  Static Variables
  //
  //--------------------------------------------------------------------------

  var DEFAULT_MARKER_SYMBOL = {
    url: require.toUrl("./symbols/mapPin.png"),
    width: "36px",
    height: "19px",
    xoffset: "9px",
    yoffset: "18px"
  };

  return declare(null, {

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    getViewProperties: function (config) {
      var viewProperties = {};

      if (config.components) {
        viewProperties.ui = {
          components: config.components.split(",")
        };
      }

      var camera = this.viewPointStringToCamera(config.viewpoint);
      if (camera) {
        viewProperties.camera = camera;
      }

      var center = this.centerStringToPoint(config.center);
      if (center) {
        viewProperties.center = center;
      }

      var level = this.levelStringToLevel(config.level);
      if (level) {
        viewProperties.zoom = level;
      }

      var extent = this.extentStringToExtent(config.extent);
      if (extent) {
        viewProperties.extent = extent;
      }

      return viewProperties;
    },

    addToView: function (view, config, searchWidget) {
      this.addMarkerToView(view, config.marker);
      this.find(view, config.find, searchWidget);
      this.setBasemapOnView(view, config.basemapUrl, config.basemapReferenceUrl);
    },

    find: function (view, findString, searchWidget) {
      if (findString) {
        if (searchWidget) {
          searchWidget.search(findString);
        }
        else {
          require(["esri/widgets/Search"], function (Search) {
            searchWidget = new Search({
              view: view
            });
            searchWidget.search(findString);
          }.bind(this));
        }
        return searchWidget;
      }
    },

    setBasemapOnView: function (view, basemapUrl, basemapReferenceUrl) {
      if (basemapUrl && view) {
        require(["esri/Basemap", "esri/layers/Layer", "esri/core/promiseList"], function (Basemap, Layer, promiseList) {
          var pl = promiseList({
            baseLayer: Layer.fromArcGISServerUrl({
              url: basemapUrl
            }),
            referenceLayer: Layer.fromArcGISServerUrl({
              url: basemapReferenceUrl
            })
          });
          pl.then(function (response) {
            if (response.baseLayer) {
              var basemapOptions = {
                baseLayers: [response.baseLayer]
              };
              if (response.referenceLayer) {
                basemapOptions.referenceLayers = [response.referenceLayer];
              }
              view.map.basemap = new Basemap(basemapOptions);
            }
          });
        }.bind(this));
      }
    },

    viewPointStringToCamera: function (viewpointParamString) {
      var viewpointArray = viewpointParamString && viewpointParamString.split(";");
      if (!viewpointArray || !viewpointArray.length) {
        return;
      }
      else {
        var cameraString = "";
        var tiltHeading = "";
        for (var i = 0; i < viewpointArray.length; i++) {
          if (viewpointArray[i].indexOf("cam:") !== -1) {
            cameraString = viewpointArray[i];
          }
          else {
            tiltHeading = viewpointArray[i];
          }
        }
        if (cameraString !== "") {
          cameraString = cameraString.substr(4, cameraString.length - 4);
          var positionArray = cameraString.split(",");
          if (positionArray.length >= 3) {
            var x = 0,
              y = 0,
              z = 0;
            x = parseFloat(positionArray[0]);
            y = parseFloat(positionArray[1]);
            z = parseFloat(positionArray[2]);
            var wkid = 4326;
            if (positionArray.length === 4) {
              wkid = parseInt(positionArray[3], 10);
            }

            var cameraPosition = new Point({
              x: x,
              y: y,
              z: z,
              spatialReference: {
                wkid: wkid
              }
            });

            var heading = 0,
              tilt = 0;
            if (tiltHeading !== "") {
              var tiltHeadingArray = tiltHeading.split(",");
              if (tiltHeadingArray.length >= 0) {
                heading = parseFloat(tiltHeadingArray[0]);
                if (tiltHeadingArray.length > 1) {
                  tilt = parseFloat(tiltHeadingArray[1]);
                }
              }
            }

            var camera = new Camera({
              position: cameraPosition,
              heading: heading,
              tilt: tilt
            });
            return camera;
          }
        }
      }
    },

    extentStringToExtent: function (extentString) {
      if (extentString) {
        //?extent=-13054125.21,4029134.71,-13032684.63,4041785.04,102100 or ?extent=-13054125.21;4029134.71;-13032684.63;4041785.04;102100
        //?extent=-117.2672,33.9927,-117.0746,34.1064 or ?extent=-117.2672;33.9927;-117.0746;34.1064
        var extentArray = this._splitArray(extentString);
        if (extentArray.length === 4 || extentArray.length === 5) {
          var xmin = parseFloat(extentArray[0]),
            ymin = parseFloat(extentArray[1]),
            xmax = parseFloat(extentArray[2]),
            ymax = parseFloat(extentArray[3]);
          if (!isNaN(xmin) && !isNaN(ymin) && !isNaN(xmax) && !isNaN(ymax)) {
            var wkid = 4326;
            if (extentArray.length === 5 && !isNaN(extentArray[4])) {
              wkid = parseInt(extentArray[4], 10);
            }
            var ext = new Extent({
              xmin: xmin,
              ymin: ymin,
              xmax: xmax,
              ymax: ymax,
              spatialReference: {
                wkid: wkid
              }
            });
            return ext;
          }
        }
      }
    },

    centerStringToPoint: function (centerString) {
      //?center=-13044705.25,4036227.41,102113&level=12 or ?center=-13044705.25;4036227.41;102113&level=12
      //?center=-117.1825,34.0552&level=12 or ?center=-117.1825;34.0552&level=12
      if (centerString) {
        var centerArray = this._splitArray(centerString);
        if (centerArray.length === 2 || centerArray.length === 3) {
          var x = parseFloat(centerArray[0]);
          var y = parseFloat(centerArray[1]);
          if (isNaN(x) || isNaN(y)) {
            x = parseFloat(centerArray[0]);
            y = parseFloat(centerArray[1]);
          }
          if (!isNaN(x) && !isNaN(y)) {
            var wkid = 4326;
            if (centerArray.length === 3 && !isNaN(centerArray[2])) {
              wkid = parseInt(centerArray[2], 10);
            }

            var point = new Point({
              x: x,
              y: y,
              spatialReference: {
                wkid: wkid
              }
            });

            return point;
          }
        }
      }
    },

    levelStringToLevel: function (levelString) {
      return levelString && parseInt(levelString, 10);
    },

    addMarkerToView: function (view, markerString) {
      // ?marker=-117;34;4326;My%20Title;http%3A//www.daisysacres.com/images/daisy_icon.gif;My%20location&level=10
      // ?marker=-117,34,4326,My%20Title,http%3A//www.daisysacres.com/images/daisy_icon.gif,My%20location&level=10
      // ?marker=-13044705.25,4036227.41,102100,My%20Title,http%3A//www.daisysacres.com/images/daisy_icon.gif,My%20location&level=10
      // ?marker=-117,34,,My%20Title,http%3A//www.daisysacres.com/images/daisy_icon.gif,My%20location&level=10
      // ?marker=-117,34,,,,My%20location&level=10
      // ?marker=-117,34&level=10
      // ?marker=10406557.402,6590748.134,2526
      if (markerString) {
        require(["esri/Graphic", "esri/PopupTemplate", "esri/symbols/PictureMarkerSymbol"], function (Graphic, PopupTemplate, PictureMarkerSymbol) {
          var markerArray = this._splitArray(markerString);
          if (markerArray.length >= 2 &&
            !isNaN(markerArray[0]) &&
            !isNaN(markerArray[1])) {
            var x = parseFloat(markerArray[0]),
              y = parseFloat(markerArray[1]),
              content = markerArray[3],
              icon_url = markerArray[4],
              label = markerArray[5];

            var wkid = 4326;
            if (!isNaN(markerArray[2])) {
              wkid = parseInt(markerArray[2], 10);
            }

            var symbolOptions;

            if (icon_url) {
              symbolOptions = {
                url: icon_url,
                height: "32px",
                width: "32px"
              };
            }
            else {
              symbolOptions = DEFAULT_MARKER_SYMBOL;
            }

            var markerSymbol = new PictureMarkerSymbol(symbolOptions);

            var point = new Point({
              "x": x,
              "y": y,
              "spatialReference": {
                "wkid": wkid
              }
            });

            var popupTemplate = null;
            if (content || label) {
              popupTemplate = new PopupTemplate({
                "title": label || null,
                "content": content || null
              });
            }

            var graphic = new Graphic({
              geometry: point,
              symbol: markerSymbol,
              popupTemplate: popupTemplate
            });

            if (graphic) {
              view.graphics.add(graphic);
              view.goTo(graphic);
            }
          }
        }.bind(this));
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _splitArray: function (value) {
      var splitValues;
      if (value) {
        splitValues = value.split(";");
        if (splitValues.length === 1) {
          splitValues = value.split(",");
        }
      }
      return splitValues;
    }

  });
});
