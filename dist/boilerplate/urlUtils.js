var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
define(["require", "exports", "esri/Camera", "esri/core/promiseUtils", "esri/core/requireUtils", "esri/geometry/Extent", "esri/geometry/Point"], function (require, exports, Camera, promiseUtils, requireUtils, Extent, Point) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------
    function getUrlParamValues(urlParams) {
        var urlObject = _urlToObject();
        var formattedUrlObject = {};
        if (!urlObject || !urlParams || !urlParams.length) {
            return;
        }
        urlParams.forEach(function (param) {
            var urlParamValue = urlObject[param];
            if (urlParamValue) {
                formattedUrlObject[param] = _foramatUrlParamValue(urlParamValue);
            }
        });
        return formattedUrlObject;
    }
    exports.getUrlParamValues = getUrlParamValues;
    function getComponents(components) {
        return components.split(",");
    }
    exports.getComponents = getComponents;
    function getCamera(viewpointString) {
        // &viewpoint=cam:-122.69174973,45.53565982,358.434;117.195,59.777
        var viewpointArray = viewpointString && viewpointString.split(";");
        if (!viewpointArray || !viewpointArray.length) {
            return;
        }
        var cameraIndex = viewpointArray[0].indexOf("cam:") !== -1 ? 0 : 1;
        var tiltAndHeadingIndex = cameraIndex === 0 ? 1 : 0;
        var cameraString = viewpointArray[cameraIndex];
        var tiltAndHeadingString = viewpointArray[tiltAndHeadingIndex];
        var cameraProperties = _getCameraProperties(cameraString, tiltAndHeadingString);
        if (cameraProperties.position) {
            return new Camera(cameraProperties);
        }
        return;
    }
    exports.getCamera = getCamera;
    function getPoint(center) {
        //?center=-13044705.25,4036227.41,102113&level=12 or ?center=-13044705.25;4036227.41;102113&level=12
        //?center=-117.1825,34.0552&level=12 or ?center=-117.1825;34.0552&level=12
        if (!center) {
            return null;
        }
        var centerArray = _splitURLString(center);
        var centerLength = centerArray.length;
        if (centerLength < 2) {
            return null;
        }
        var x = parseFloat(centerArray[0]);
        var y = parseFloat(centerArray[1]);
        if (isNaN(x) || isNaN(y)) {
            return null;
        }
        var wkid = centerLength === 3 ? parseInt(centerArray[2], 10) : 4326;
        return new Point({
            x: x,
            y: y,
            spatialReference: {
                wkid: wkid
            }
        });
    }
    exports.getPoint = getPoint;
    function getZoom(level) {
        return level && parseInt(level, 10);
    }
    exports.getZoom = getZoom;
    function getExtent(extent) {
        //?extent=-13054125.21,4029134.71,-13032684.63,4041785.04,102100 or ?extent=-13054125.21;4029134.71;-13032684.63;4041785.04;102100
        //?extent=-117.2672,33.9927,-117.0746,34.1064 or ?extent=-117.2672;33.9927;-117.0746;34.1064
        if (!extent) {
            return null;
        }
        var extentArray = _splitURLString(extent);
        var extentLength = extentArray.length;
        if (extentLength < 4) {
            return null;
        }
        var xmin = parseFloat(extentArray[0]), ymin = parseFloat(extentArray[1]), xmax = parseFloat(extentArray[2]), ymax = parseFloat(extentArray[3]);
        if (isNaN(xmin) || isNaN(ymin) || isNaN(xmax) || isNaN(ymax)) {
            return null;
        }
        var wkid = extentLength === 5 ? parseInt(extentArray[4], 10) : 4326;
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
    exports.getExtent = getExtent;
    // todo: test this functionality
    function getGraphic(marker) {
        // ?marker=-117;34;4326;My%20Title;http%3A//www.daisysacres.com/images/daisy_icon.gif;My%20location&level=10
        // ?marker=-117,34,4326,My%20Title,http%3A//www.daisysacres.com/images/daisy_icon.gif,My%20location&level=10
        // ?marker=-13044705.25,4036227.41,102100,My%20Title,http%3A//www.daisysacres.com/images/daisy_icon.gif,My%20location&level=10
        // ?marker=-117,34,,My%20Title,http%3A//www.daisysacres.com/images/daisy_icon.gif,My%20location&level=10
        // ?marker=-117,34,,,,My%20location&level=10
        // ?marker=-117,34&level=10
        // ?marker=10406557.402,6590748.134,2526
        if (!marker) {
            return null;
        }
        var markerArray = _splitURLString(marker);
        var markerLength = markerArray.length;
        if (markerLength < 2) {
            return null;
        }
        return requireUtils.when(require, [
            "esri/Graphic",
            "esri/PopupTemplate",
            "esri/symbols/PictureMarkerSymbol"
        ]).then(function (modules) {
            var Graphic = modules[0], PopupTemplate = modules[1], PictureMarkerSymbol = modules[2];
            var x = parseFloat(markerArray[0]);
            var y = parseFloat(markerArray[1]);
            var content = markerArray[3];
            var icon_url = markerArray[4];
            var label = markerArray[5];
            var wkid = markerArray[2] ? parseInt(markerArray[2], 10) : 4326;
            var symbolSize = "32px"; // todo: fix typings in next JS API release.
            var defaultMarkerSymbol = {
                url: "./symbols/mapPin.png",
                width: "36px",
                height: "19px",
                xoffset: "9px",
                yoffset: "18px" // todo: fix typings in next JS API release.
            };
            var symbolOptions = icon_url ? {
                url: icon_url,
                height: symbolSize,
                width: symbolSize
            } : defaultMarkerSymbol;
            var markerSymbol = new PictureMarkerSymbol(symbolOptions);
            var point = new Point({
                "x": x,
                "y": y,
                "spatialReference": {
                    "wkid": wkid
                }
            });
            var hasPopupDetails = content || label;
            var popupTemplate = hasPopupDetails ?
                new PopupTemplate({
                    "title": label || null,
                    "content": content || null
                }) : null;
            var graphic = new Graphic({
                geometry: point,
                symbol: markerSymbol,
                popupTemplate: popupTemplate
            });
            return graphic;
        });
    }
    exports.getGraphic = getGraphic;
    // todo: test this functionality
    function getBasemap(basemapUrl, basemapReferenceUrl) {
        if (!basemapUrl) {
            return promiseUtils.resolve();
        }
        return requireUtils.when(require, ["esri/Layer", "esri/Basemap"]).then(function (modules) {
            var Layer = modules[0], Basemap = modules[1];
            var getBaseLayer = Layer.fromArcGISServerUrl({
                url: basemapUrl
            });
            var getReferenceLayer = basemapReferenceUrl ? Layer.fromArcGISServerUrl({
                url: basemapReferenceUrl
            }) : promiseUtils.resolve();
            var getBaseLayers = promiseUtils.eachAlways({
                baseLayer: getBaseLayer,
                referenceLayer: getReferenceLayer
            });
            return getBaseLayers.then(function (response) {
                var baseLayer = response.baseLayer;
                var referenceLayer = response.referenceLayer;
                var basemapOptions = {
                    baseLayers: baseLayer ? [baseLayer] : [],
                    referenceLayers: referenceLayer ? [referenceLayer] : []
                };
                return new Basemap(basemapOptions);
            });
        });
    }
    exports.getBasemap = getBasemap;
    // todo: test
    function find(find, view) {
        if (!find || !view) {
            return promiseUtils.resolve();
        }
        return requireUtils.when(require, "esri/widgets/Search/SearchViewModel").then(function (SearchViewModel) {
            var searchVM = new SearchViewModel({
                view: view
            });
            return searchVM.search(find);
        });
    }
    exports.find = find;
    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------
    function _splitURLString(value) {
        if (!value) {
            return null;
        }
        var splitValues = value.split(";");
        return splitValues.length === 1 ? value.split(",") : null;
    }
    function _getCameraPosition(cameraString) {
        if (!cameraString) {
            return null;
        }
        var cameraValues = cameraString.substr(4, cameraString.length - 4);
        var positionArray = cameraValues.split(",");
        if (positionArray.length < 3) {
            return null;
        }
        var x = parseFloat(positionArray[0]), y = parseFloat(positionArray[1]), z = parseFloat(positionArray[2]);
        var wkid = positionArray.length === 4 ? parseInt(positionArray[3], 10) : 4326;
        return new Point({
            x: x,
            y: y,
            z: z,
            spatialReference: {
                wkid: wkid
            }
        });
    }
    function _getTiltAndHeading(tiltAndHeading) {
        if (tiltAndHeading == "") {
            return null;
        }
        var tiltHeadingArray = tiltAndHeading.split(",");
        return tiltHeadingArray.length >= 0 ? {
            heading: parseFloat(tiltHeadingArray[0]),
            tilt: parseFloat(tiltHeadingArray[1])
        } : null;
    }
    function _getCameraProperties(cameraString, tiltAndHeading) {
        var cameraPosition = _getCameraPosition(cameraString);
        var tiltAndHeadingProperties = _getTiltAndHeading(tiltAndHeading);
        return __assign({ position: cameraPosition }, tiltAndHeadingProperties);
    }
    function _stripStringTags(value) {
        var tagsRE = /<\/?[^>]+>/g;
        return value.replace(tagsRE, "");
    }
    function _urlToObject() {
        // retrieve url parameters. Templates all use url parameters to determine which arcgis.com
        // resource to work with.
        // Scene templates use the webscene param to define the scene to display
        // appid is the id of the application based on the template. We use this
        // id to retrieve application specific configuration information. The configuration
        // information will contain the values the  user selected on the template configuration
        // panel.
        var query = (window.location.search || "?").substr(1), map = {};
        var urlRE = /([^&=]+)=?([^&]*)(?:&+|$)/g;
        query.replace(urlRE, function (match, key, value) {
            map[key] = _stripStringTags(decodeURIComponent(value));
            return "";
        });
        return map;
    }
    function _foramatUrlParamValue(urlParamValue) {
        if (typeof urlParamValue === "string") {
            switch (urlParamValue.toLowerCase()) {
                case "true":
                    return true;
                case "false":
                    return false;
                default:
                    return urlParamValue;
            }
        }
        return urlParamValue;
    }
});
//# sourceMappingURL=urlUtils.js.map