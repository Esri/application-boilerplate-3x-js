/*
  Version 1
  1/7/2016
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
define(
[
  "dojo/_base/declare",
  "dojo/_base/array",
  "dojo/_base/lang",

  "esri/config",
  "esri/lang",

  "esri/geometry/Extent",
  "esri/geometry/Point",
  "esri/SpatialReference",

  "esri/tasks/ProjectParameters",
  "esri/tasks/GeometryService",

  "dojo/promise/all",
  "dojo/Deferred",

],
function(
  declare,
  array,
  lang,

  esriConfig, esriLang,

  Extent, Point,
  SpatialReference,

  ProjectParameters,
  GeometryService,

  all,
  Deferred
) {

  var MapUrlParams = declare([], {
    constructor: function(params){
      lang.mixin(this, params);
      if(!esriConfig.defaults.geometryService && this.geometryService){
        esriConfig.defaults.geometryService = new GeometryService(this.geometryService);
      }
      if(this.mapSpatialReference){
        this.mapSpatialReference = new SpatialReference(this.mapSpatialReference);
      }
    },
    center: null,
    extent: null,
    level: null,
    defaultMarkerSymbol: null,
    defaultMarkerSymbolWidth: null,
    defaultMarkerSymbolHeight: null,
    mapSpatialReference: null,
    processUrlParams: function(){
      var def =  new Deferred(), deferreds = [];

      if(this.center){
       deferreds.push(this._createCenter());
      }
      if(this.level){
        deferreds.push(this._createLevel());
      }
      if(this.extent){
        deferreds.push(this._createExtent());
      }
      if(this.marker){
        deferreds.push(this._createMarker());
      }
      all(deferreds).then(lang.hitch(this, function(results){
        var params = {
          mapOptions: {}
        };
        array.forEach(results, function(result){
          if(result && result.center){
            params.mapOptions.center = result.center;
          }
          if(result && result.zoom){
            params.mapOptions.zoom = result.zoom;
          }
          if(result && result.extent){
            params.mapOptions.extent = result.extent;
          }

          if(result && result.markerGraphic){
            params.markerGraphic = result.markerGraphic;
          }
        });
        def.resolve(params);
      }),function(error){
        def.reject(error);
      });
      return def.promise;
    },
    _createExtent: function(){
      //?extent=-13054125.21,4029134.71,-13032684.63,4041785.04,102100 or ?extent=-13054125.21;4029134.71;-13032684.63;4041785.04;102100
      //?extent=-117.2672,33.9927,-117.0746,34.1064 or ?extent=-117.2672;33.9927;-117.0746;34.1064
      var deferred = new Deferred();
      var extentArray = this._splitArray(this.extent);
      if(extentArray.length === 4 || extentArray.length === 5){
        var minx = parseFloat(extentArray[0]),
          miny = parseFloat(extentArray[1]),
          maxx = parseFloat(extentArray[2]),
          maxy = parseFloat(extentArray[3]);
        if(!isNaN(minx) && !isNaN(miny) && !isNaN(maxx) && !isNaN(maxy)){
         var wkid = 4326;
         if(extentArray.length === 5 && !isNaN(extentArray[4])){
          wkid = parseInt(extentArray[4],10);
         }
         var ext = new Extent(minx, miny, maxx, maxy, new SpatialReference({"wkid": wkid}));

        this._project(ext).then(lang.hitch(this, function(pExt){
            var projectedResult = (pExt) ? {"extent": pExt} : null;
            deferred.resolve(projectedResult);
        }),function(error){
          deferred.reject(error);
        });

        }else{
          deferred.reject();
        }
      }else{
        deferred.reject();
      }

      return deferred.promise;
    },
    _createCenter: function(){
    //?center=-13044705.25,4036227.41,102113&level=12 or ?center=-13044705.25;4036227.41;102113&level=12
    //?center=-117.1825,34.0552&level=12 or ?center=-117.1825;34.0552&level=12
    var deferred = new Deferred();
    var centerArray = this._splitArray(this.center);
    if (centerArray.length === 2 || centerArray.length === 3) {
      var x = parseFloat(centerArray[0]);
      var y = parseFloat(centerArray[1]);
      if (isNaN(x) || isNaN(y)) {
        x = parseFloat(centerArray[0]);
        y = parseFloat(centerArray[1]);
      }
      if (!isNaN(x) && !isNaN(y)) {
        var wkid = 4326;
        if (centerArray.length === 3 && !isNaN(centerArray[2])){
          wkid = parseInt(centerArray[2], 10);
        }

        var point = new Point(x, y, new SpatialReference(wkid));
        this._project(point).then(lang.hitch(this, function(pPoint){
          var projectedResult = (pPoint) ? {"center": pPoint} : null;
          deferred.resolve(projectedResult);
        }),deferred.reject);

      }else{
        deferred.reject();
      }
    }else{
      deferred.reject();
    }

      return deferred.promise;
    },
    _createLevel: function(){
      // ?level=4
      var deferred = new Deferred();
      var level = this.level;
      if (level) {
        deferred.resolve({"zoom":parseInt(level)});
      }else{
        deferred.reject();
      }
      return deferred.promise;
    },
    _createMarker: function(){
      var deferred = new Deferred();
      /*
      ?marker=-117;34;4326;My%20Title;http%3A//www.daisysacres.com/images/daisy_icon.gif;My%20location&level=10
      ?marker=-117,34,4326,My%20Title,http%3A//www.daisysacres.com/images/daisy_icon.gif,My%20location&level=10
      ?marker=-13044705.25,4036227.41,102100,My%20Title,http%3A//www.daisysacres.com/images/daisy_icon.gif,My%20location&level=10
      ?marker=-117,34,,My%20Title,http%3A//www.daisysacres.com/images/daisy_icon.gif,My%20location&level=10
      ?marker=-117,34,,,,My%20location&level=10
      ?marker=-117,34&level=10
      ?marker=10406557.402,6590748.134,2526&level=10
      */
      require(["esri/symbols/PictureMarkerSymbol", "esri/graphic","esri/dijit/PopupTemplate"], lang.hitch(this, function(PictureMarkerSymbol, Graphic, PopupTemplate){
         var markerArray = this._splitArray(this.marker);
         if (markerArray.length >= 2 &&
         !isNaN(markerArray[0]) &&
         !isNaN(markerArray[1])) {
            var x = parseFloat(markerArray[0]),
              y = parseFloat(markerArray[1]),
              wkid = markerArray[2] || null,
              description = markerArray[3] || null,
              icon_url = markerArray[4] || this.defaultMarkerSymbol || null,
              label = markerArray[5] || null;


              var markerSymbol = new PictureMarkerSymbol(icon_url, this.defaultMarkerSymbolWidth || 26, this.defaultMarkerSymbolHeight || 26);
              var point = new Point({
                  "x": x,
                  "y": y,
                  "spatialReference": {
                      "wkid": wkid || 4326
                  }
              });

              var infoTemplate = null;
              if (description || label) {
                  infoTemplate = new PopupTemplate({
                      "title": label || null,
                      "description": description || null
                  });
              }
              this._project(point).then(lang.hitch(this, function(pPoint){
                var projectedGraphic = new Graphic(pPoint, markerSymbol, null, infoTemplate);
                var projectedResult = (pPoint) ? {"markerGraphic": projectedGraphic} : null;
                deferred.resolve(projectedResult);
              }),deferred.reject);
         }else{
           deferred.reject();
         }
      }));
      return deferred.promise;
    },
    _splitArray: function(value){
      var splitValues = value.split(";");
      if(splitValues.length === 1){
        splitValues = value.split(",");
      }
      return splitValues;
    },
    _project: function(geometry){
      var deferred = new Deferred();
      if(this._sameSpatialReference(geometry.spatialReference, this.mapSpatialReference)){
          deferred.resolve(geometry);
      }else{
        esriConfig.defaults.geometryService.project([geometry], this.mapSpatialReference).then(lang.hitch(this, function(projectedGeometry){
            if(projectedGeometry && projectedGeometry.length && projectedGeometry.length > 0){
              deferred.resolve(projectedGeometry[0]);
            }else{
              deferred.reject();
            }
        }),function(error){
          deferred.reject(error);
        });
      }
      return deferred.promise;
    },
    _sameSpatialReference: function(sp1, sp2) {
      var same = false;
      var mercator = [102113, 102100, 3857];
      if (sp1 && sp2 && sp1.wkt == sp2.wkt && (sp1.wkid == sp2.wkid || (esriLang.isDefined(sp1.latestWkid) && sp1.latestWkid == sp2.wkid) || (esriLang.isDefined(sp2.latestWkid) && sp1.wkid == sp2.latestWkid) || (esriLang.isDefined(sp1.latestWkid) && sp1.latestWkid == sp2.latestWkid))) {
        same = true;
      } else if (sp1 && sp2 && sp1.wkid && sp2.wkid && (array.indexOf(mercator, sp1.wkid) != -1) && (array.indexOf(mercator, sp2.wkid)!= -1)) {
        same = true;
      }
      return same;
    }
  });

  return MapUrlParams;

});
