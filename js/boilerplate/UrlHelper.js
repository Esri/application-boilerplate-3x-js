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

  "esri/geometry/Point",
  "esri/geometry/SpatialReference"

], function (
  declare,
  Camera,
  Point, SpatialReference
) {

  //--------------------------------------------------------------------------
  //
  //  Static Variables
  //
  //--------------------------------------------------------------------------


  return declare(null, {

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------


    cameraFromViewpoint: function (viewpointParamString) {
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
            var cameraPosition = new Point(x, y, z, sr);
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
    }

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------


  });
});
