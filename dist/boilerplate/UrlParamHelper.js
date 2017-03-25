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
        yoffset: "18px" // todo: fix typings in next JS API release.
    };
    var UrlParamHelper = (function () {
        function UrlParamHelper() {
        }
        UrlParamHelper.prototype.getViewProperties = function (config) {
            var viewProperties = {};
            var components = config.components.split(",");
            if (config.components) {
                viewProperties.ui = {
                    components: components
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
            // todo
            var cameraString = "";
            var tiltHeading = "";
            viewpointArray.forEach(function (viewpointItem) {
                viewpointItem.indexOf("cam:") !== -1 ? cameraString = viewpointItem : tiltHeading = viewpointItem;
            });
            if (cameraString !== "") {
                cameraString = cameraString.substr(4, cameraString.length - 4);
                var positionArray = cameraString.split(",");
                if (positionArray.length >= 3) {
                    var x = parseFloat(positionArray[0]), y = parseFloat(positionArray[1]), z = parseFloat(positionArray[2]);
                    var wkid = positionArray.length === 4 ? parseInt(positionArray[3], 10) : 4326;
                    var cameraPosition = new Point({
                        x: x,
                        y: y,
                        z: z,
                        spatialReference: {
                            wkid: wkid
                        }
                    });
                    var cameraTiltAndHeading = this._getCameraTiltAndHeading(tiltHeading); // todo
                    var camera = new Camera({
                        position: cameraPosition,
                        heading: cameraTiltAndHeading.heading,
                        tilt: cameraTiltAndHeading.tilt
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
                var extentLength = extentArray.length;
                if (extentLength === 4 || extentLength === 5) {
                    var xmin = parseFloat(extentArray[0]), ymin = parseFloat(extentArray[1]), xmax = parseFloat(extentArray[2]), ymax = parseFloat(extentArray[3]);
                    if (!isNaN(xmin) && !isNaN(ymin) && !isNaN(xmax) && !isNaN(ymax)) {
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
                }
            }
        };
        UrlParamHelper.prototype.centerStringToPoint = function (centerString) {
            //?center=-13044705.25,4036227.41,102113&level=12 or ?center=-13044705.25;4036227.41;102113&level=12
            //?center=-117.1825,34.0552&level=12 or ?center=-117.1825;34.0552&level=12
            if (centerString) {
                var centerArray = this._splitURLString(centerString);
                var centerLength = centerArray.length;
                if (centerLength === 2 || centerLength === 3) {
                    var x = parseFloat(centerArray[0]);
                    var y = parseFloat(centerArray[1]);
                    if (!isNaN(x) && !isNaN(y)) {
                        var wkid = centerLength === 3 ? parseInt(centerArray[2], 10) : 4326;
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
                var markerLength = markerArray.length;
                if (markerLength >= 2) {
                    var x = parseFloat(markerArray[0]), y = parseFloat(markerArray[1]), content = markerArray[3], icon_url = markerArray[4], label = markerArray[5];
                    var wkid = markerArray[2] ? parseInt(markerArray[2], 10) : 4326;
                    var symbolSize = "32px"; // todo: fix typings in next JS API release.
                    var symbolOptions = icon_url ? {
                        url: icon_url,
                        height: symbolSize,
                        width: symbolSize
                    } : DEFAULT_MARKER_SYMBOL;
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
        UrlParamHelper.prototype._getCameraTiltAndHeading = function (tiltHeading) {
            if (tiltHeading == "") {
                return null;
            }
            var tiltHeadingArray = tiltHeading.split(",");
            return tiltHeadingArray.length >= 0 ? {
                heading: parseFloat(tiltHeadingArray[0]),
                tilt: parseFloat(tiltHeadingArray[1])
            } : null;
        };
        UrlParamHelper.prototype._getCameraProperties = function (cameraString) {
        };
        UrlParamHelper.prototype._splitURLString = function (value) {
            if (!value) {
                return null;
            }
            var splitValues = value.split(";");
            return splitValues.length === 1 ? value.split(",") : null;
        };
        return UrlParamHelper;
    }());
    exports.default = UrlParamHelper;
});
//# sourceMappingURL=UrlParamHelper.js.map