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

  "dojo/Deferred",

  "esri/core/promiseUtils",

  "esri/config",

  "esri/Camera",

  "esri/portal/Portal",

  "esri/geometry/Extent",
  "esri/geometry/Point",
  "esri/geometry/SpatialReference",
  "esri/geometry/support/webMercatorUtils",

  "esri/tasks/GeometryService",
  "esri/tasks/support/ProjectParameters"

], function (
  declare,
  Deferred,
  promiseUtils,
  esriConfig,
  Portal,
  Camera,
  Extent, Point, SpatialReference, webMercatorUtils,
  GeometryService, ProjectParameters
) {

  //--------------------------------------------------------------------------
  //
  //  Static Variables
  //
  //--------------------------------------------------------------------------

  var DEFAULT_MARKER_SYMBOL_URL = "";
  var DEFAULT_MARKER_SYMBOL_WIDTH = 26;
  var DEFAULT_MARKER_SYMBOL_HEIGHT = 26;

  return declare(null, {

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    view: null,

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------


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
            var sr = SpatialReference.WGS84;
            if (positionArray.length === 4) {
              sr = new SpatialReference(parseInt(positionArray[3], 10));
            }

            var cameraPosition = new Point({
              x: x,
              y: y,
              z: z,
              spatialReference: sr
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

    levelStringToLevel: function (levelString) {
      return parseInt(levelString, 10);
    },

    extentStringToExtent: function (extentString) {
      var view = this.view;
      //?extent=-13054125.21,4029134.71,-13032684.63,4041785.04,102100 or ?extent=-13054125.21;4029134.71;-13032684.63;4041785.04;102100
      //?extent=-117.2672,33.9927,-117.0746,34.1064 or ?extent=-117.2672;33.9927;-117.0746;34.1064
      var deferred = new Deferred();
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
          this._projectGeometry(ext, view).then(function (pExt) {
            deferred.resolve(pExt);
          }, function (error) {
            deferred.reject(error);
          });
        }
        else {
          deferred.reject();
        }
      }
      else {
        deferred.reject();
      }
      return deferred.promise;
    },

    centerStringToPoint: function (centerString) {
      var view = this.view;
      //?center=-13044705.25,4036227.41,102113&level=12 or ?center=-13044705.25;4036227.41;102113&level=12
      //?center=-117.1825,34.0552&level=12 or ?center=-117.1825;34.0552&level=12
      var deferred = new Deferred();
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

          this._projectGeometry(point, view).then(function (pPoint) {
            deferred.resolve(pPoint);
          }, deferred.reject);
        }
        else {
          deferred.reject();
        }
      }
      else {
        deferred.reject();
      }
      return deferred.promise;
    },

    markerStringToGraphic: function (markerString) {
      var view = this.view;
      var deferred = new Deferred();
      // ?marker=-117;34;4326;My%20Title;http%3A//www.daisysacres.com/images/daisy_icon.gif;My%20location&level=10
      // ?marker=-117,34,4326,My%20Title,http%3A//www.daisysacres.com/images/daisy_icon.gif,My%20location&level=10
      // ?marker=-13044705.25,4036227.41,102100,My%20Title,http%3A//www.daisysacres.com/images/daisy_icon.gif,My%20location&level=10
      // ?marker=-117,34,,My%20Title,http%3A//www.daisysacres.com/images/daisy_icon.gif,My%20location&level=10
      // ?marker=-117,34,,,,My%20location&level=10
      // ?marker=-117,34&level=10
      // ?marker=10406557.402,6590748.134,2526&level=10
      require(["esri/symbols/PictureMarkerSymbol", "esri/Graphic", "esri/PopupTemplate"], function (PictureMarkerSymbol, Graphic, PopupTemplate) {
        var markerArray = this._splitArray(markerString);
        if (markerArray.length >= 2 &&
          !isNaN(markerArray[0]) &&
          !isNaN(markerArray[1])) {
          var x = parseFloat(markerArray[0]),
            y = parseFloat(markerArray[1]),
            wkid = markerArray[2] || null,
            content = markerArray[3] || null,
            icon_url = markerArray[4] || DEFAULT_MARKER_SYMBOL_URL || null,
            label = markerArray[5] || null;

          var markerSymbol = new PictureMarkerSymbol({
            url: icon_url,
            width: DEFAULT_MARKER_SYMBOL_WIDTH,
            height: DEFAULT_MARKER_SYMBOL_HEIGHT
          });

          var point = new Point({
            "x": x,
            "y": y,
            "spatialReference": {
              "wkid": wkid || 4326
            }
          });

          var popupTemplate = null;
          if (content || label) {
            popupTemplate = new PopupTemplate({
              "title": label || null,
              "content": content || null
            });
          }

          this._projectGeometry(point, view).then(function (pPoint) {
            var projectedGraphic = new Graphic({
              geometry: pPoint,
              symbol: markerSymbol,
              popupTemplate: popupTemplate
            });
            deferred.resolve(projectedGraphic);
          }, deferred.reject);
        }
        else {
          deferred.reject();
        }
      }.bind(this));
      return deferred.promise;
    },

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _splitArray: function (value) {
      var splitValues = value.split(";");
      if (splitValues.length === 1) {
        splitValues = value.split(",");
      }
      return splitValues;
    },

    _projectGeometry: function (geometry, view) {

      if (!view) {
        return geometry;
      }

      var sr = view.spatialReference;
      if (sr.isWGS84) {
        // projection unnecessary
        return promiseUtils.resolve(geometry);
      }

      if (sr.isWebMercator) {
        return promiseUtils.resolve(
          webMercatorUtils.geographicToWebMercator(geometry)
        );
      }

      return this._getGeometryServiceUrl()
        .then(function (geometryServiceUrl) {
          if (!geometryServiceUrl) {
            return promiseUtils.reject(new Error("geometry-service:missing-url", "Geometry service URL is missing"));
          }

          var geomService = new GeometryService({
            url: geometryServiceUrl
          });
          var params = new ProjectParameters({
            geometries: [geometry],
            outSR: sr
          });

          return geomService.project(params)
            .then(function (projectedGeometries) {
              return projectedGeometries[0];
            });
        });
    },

    _getGeometryServiceUrl: function () {
      if (esriConfig.geometryServiceUrl) {
        return promiseUtils.resolve(esriConfig.geometryServiceUrl);
      }

      var defaultPortal = Portal.getDefault();

      return defaultPortal
        .load()
        .always(function () {
          return defaultPortal.get("helperServices.geometry.url");
        });
    }


  });
});
