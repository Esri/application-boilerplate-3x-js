define(["require", "exports", "esri/Camera", "esri/geometry/Extent", "esri/geometry/Point", "esri/widgets/Search", "esri/Basemap", "esri/layers/Layer", "esri/core/promiseUtils", "esri/Graphic", "esri/PopupTemplate", "esri/symbols/PictureMarkerSymbol", "esri/views/SceneView"], function (require, exports, Camera, Extent, Point, Search, Basemap, Layer, promiseList, Graphic, PopupTemplate, PictureMarkerSymbol, SceneView) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //--------------------------------------------------------------------------
    //
    //  Static constiables
    //
    //--------------------------------------------------------------------------
    var DEFAULT_MARKER_SYMBOL = {
        url: "./symbols/mapPin.png",
        width: "36px",
        height: "19px",
        xoffset: "9px",
        yoffset: "18px"
    };
    var UrlParamHelper = (function () {
        function UrlParamHelper() {
        }
        UrlParamHelper.prototype.getViewProperties = function (config) {
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
        };
        UrlParamHelper.prototype.addToView = function (view, config, searchWidget) {
            this.addMarkerToView(view, config.marker);
            this.find(view, config.find, searchWidget);
            this.setBasemapOnView(view, config.basemapUrl, config.basemapReferenceUrl);
        };
        UrlParamHelper.prototype.find = function (view, findString, searchWidget) {
            if (!findString) {
                return;
            }
            if (searchWidget) {
                searchWidget.search(findString);
            }
            else {
                searchWidget = new Search({
                    view: view
                });
                searchWidget.search(findString);
            }
            return searchWidget;
        };
        UrlParamHelper.prototype.setBasemapOnView = function (view, basemapUrl, basemapReferenceUrl) {
            if (!basemapUrl || !view) {
                return;
            }
            var pl = promiseList.eachAlways({
                baseLayer: Layer.fromArcGISServerUrl({
                    url: basemapUrl
                }),
                referenceLayer: Layer.fromArcGISServerUrl({
                    url: basemapReferenceUrl
                })
            });
            pl.then(function (response) {
                var baseLayer = response.baseLayer;
                var referenceLayer = response.referenceLayer;
                if (!baseLayer) {
                    return;
                }
                var basemapOptions = {
                    baseLayers: baseLayer,
                    referenceLayers: referenceLayer
                };
                view.map.basemap = new Basemap(basemapOptions);
            });
        };
        UrlParamHelper.prototype.viewPointStringToCamera = function (viewpointParamString) {
            var viewpointArray = viewpointParamString && viewpointParamString.split(";");
            if (!viewpointArray || !viewpointArray.length) {
                return;
            }
            var cameraString = "";
            var tiltHeading = "";
            viewpointArray.forEach(function (viewpointItem) {
                viewpointItem.indexOf("cam:") !== -1 ? cameraString = viewpointItem : tiltHeading = viewpointItem;
            });
            if (cameraString !== "") {
                cameraString = cameraString.substr(4, cameraString.length - 4);
                var positionArray = cameraString.split(",");
                if (positionArray.length >= 3) {
                    var x = 0, y = 0, z = 0;
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
                    var heading = 0, tilt = 0;
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
        };
        UrlParamHelper.prototype.extentStringToExtent = function (extentString) {
            if (extentString) {
                //?extent=-13054125.21,4029134.71,-13032684.63,4041785.04,102100 or ?extent=-13054125.21;4029134.71;-13032684.63;4041785.04;102100
                //?extent=-117.2672,33.9927,-117.0746,34.1064 or ?extent=-117.2672;33.9927;-117.0746;34.1064
                var extentArray = this._splitURLString(extentString);
                if (extentArray.length === 4 || extentArray.length === 5) {
                    var xmin = parseFloat(extentArray[0]), ymin = parseFloat(extentArray[1]), xmax = parseFloat(extentArray[2]), ymax = parseFloat(extentArray[3]);
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
        };
        UrlParamHelper.prototype.centerStringToPoint = function (centerString) {
            //?center=-13044705.25,4036227.41,102113&level=12 or ?center=-13044705.25;4036227.41;102113&level=12
            //?center=-117.1825,34.0552&level=12 or ?center=-117.1825;34.0552&level=12
            if (centerString) {
                var centerArray = this._splitURLString(centerString);
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
                        return new Point({
                            x: x,
                            y: y,
                            spatialReference: {
                                wkid: wkid
                            }
                        });
                    }
                }
            }
        };
        UrlParamHelper.prototype.levelStringToLevel = function (levelString) {
            return levelString && parseInt(levelString, 10);
        };
        UrlParamHelper.prototype.addMarkerToView = function (view, markerString) {
            // ?marker=-117;34;4326;My%20Title;http%3A//www.daisysacres.com/images/daisy_icon.gif;My%20location&level=10
            // ?marker=-117,34,4326,My%20Title,http%3A//www.daisysacres.com/images/daisy_icon.gif,My%20location&level=10
            // ?marker=-13044705.25,4036227.41,102100,My%20Title,http%3A//www.daisysacres.com/images/daisy_icon.gif,My%20location&level=10
            // ?marker=-117,34,,My%20Title,http%3A//www.daisysacres.com/images/daisy_icon.gif,My%20location&level=10
            // ?marker=-117,34,,,,My%20location&level=10
            // ?marker=-117,34&level=10
            // ?marker=10406557.402,6590748.134,2526
            if (markerString) {
                var markerArray = this._splitURLString(markerString);
                if (markerArray.length >= 2 &&
                    !isNaN(markerArray[0]) &&
                    !isNaN(markerArray[1])) {
                    var x = parseFloat(markerArray[0]), y = parseFloat(markerArray[1]), content = markerArray[3], icon_url = markerArray[4], label = markerArray[5];
                    var wkid = 4326;
                    if (!isNaN(markerArray[2])) {
                        wkid = parseInt(markerArray[2], 10);
                    }
                    var symbolOptions = void 0;
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
                    if (graphic) {
                        view.graphics.add(graphic);
                        // todo: will be cleaned up in next JS API release.
                        if (view instanceof SceneView) {
                            view.goTo(graphic);
                        }
                        else {
                            view.goTo(graphic);
                        }
                    }
                }
            }
        };
        // todo: cleanup function
        UrlParamHelper.prototype._splitURLString = function (value) {
            var splitValues;
            if (value) {
                splitValues = value.split(";");
                if (splitValues.length === 1) {
                    splitValues = value.split(",");
                }
            }
            return splitValues;
        };
        return UrlParamHelper;
    }());
    exports.default = UrlParamHelper;
});
//# sourceMappingURL=UrlParamHelper.js.map