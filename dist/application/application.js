var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
define(["require", "exports", "dojo/i18n!application/nls/resources.js", "esri/core/requireUtils", "application/itemHelper", "application/domHelper", "application/urlHelper"], function (require, exports, i18n, requireUtils, itemHelper_1, domHelper_1, urlHelper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /// <amd-dependency path="dojo/i18n!application/nls/resources.js" name="i18n" />
    var Application = (function () {
        function Application() {
            //--------------------------------------------------------------------------
            //
            //  Properties
            //
            //--------------------------------------------------------------------------
            //----------------------------------
            //  boilerplate
            //----------------------------------
            this.boilerplate = null;
        }
        //--------------------------------------------------------------------------
        //
        //  Public Methods
        //
        //--------------------------------------------------------------------------
        Application.prototype.init = function (boilerplate) {
            if (!boilerplate) {
                domHelper_1.addPageError(i18n.error, "app:: Boilerplate is not defined");
                return;
            }
            this.boilerplate = boilerplate;
            var config = boilerplate.config, results = boilerplate.results, settings = boilerplate.settings;
            var webMapItem = results.webMapItem.value;
            var webSceneItem = results.webSceneItem.value;
            var groupItemsValue = results.groupItems.value;
            var groupInfoValue = results.groupInfo.value;
            var groupItems = groupItemsValue && groupItemsValue.results;
            var groupInfoItem = groupInfoValue && groupInfoValue.results && groupInfoValue.results[0];
            if (!webMapItem && !webSceneItem && !groupInfoItem) {
                domHelper_1.addPageError(i18n.error, "app:: Could not load an item to display");
                return;
            }
            domHelper_1.setPageLocale(boilerplate.locale);
            domHelper_1.setPageDirection(boilerplate.direction);
            if (!config.title) {
                config.title = itemHelper_1.getItemTitle(webSceneItem || webMapItem || groupInfoItem);
            }
            domHelper_1.setPageTitle(config.title);
            // todo: support multiple webscenes, webmaps, groups.
            if (webMapItem) {
                this._createWebMap(webMapItem, config, settings).then(function (view) {
                    if (config.find) {
                        urlHelper_1.find(config.find, view);
                    }
                    domHelper_1.removePageLoading();
                }).otherwise(function (error) {
                    domHelper_1.addPageError(i18n.error, error.message);
                });
            }
            else if (webSceneItem) {
                this._createWebScene(webSceneItem, config, settings).then(function (view) {
                    if (config.find) {
                        urlHelper_1.find(config.find, view);
                    }
                    domHelper_1.removePageLoading();
                }).otherwise(function (error) {
                    domHelper_1.addPageError(i18n.error, error.message);
                });
            }
            else if (groupItems) {
                var galleryHTML = this._createGroupGallery(groupInfoItem, groupItems);
                if (!galleryHTML) {
                    domHelper_1.addPageError(i18n.error, "app:: group data does not exist.");
                }
                else {
                    document.body.innerHTML = galleryHTML;
                    domHelper_1.removePageLoading();
                }
            }
        };
        //--------------------------------------------------------------------------
        //
        //  Private Methods
        //
        //--------------------------------------------------------------------------
        Application.prototype._createWebMap = function (webMapItem, config, settings) {
            return itemHelper_1.createWebMapFromItem(webMapItem).then(function (map) {
                var ui = config.components ? { components: urlHelper_1.getComponents(config.components) } : {};
                var urlViewProperties = {
                    ui: ui,
                    camera: urlHelper_1.getCamera(config.camera),
                    center: urlHelper_1.getPoint(config.center),
                    zoom: urlHelper_1.getZoom(config.level),
                    extent: urlHelper_1.getExtent(config.extent)
                };
                var basemapUrl = config.basemapUrl, basemapReferenceUrl = config.basemapReferenceUrl, marker = config.marker;
                if (basemapUrl) {
                    urlHelper_1.getBasemap(basemapUrl, basemapReferenceUrl).then(function (basemap) {
                        map.basemap = basemap;
                    });
                }
                var viewProperties = __assign({ map: map, container: settings.webmap.containerId }, urlViewProperties);
                return requireUtils.when(require, "esri/views/MapView").then(function (MapView) {
                    var mapView = new MapView(viewProperties);
                    mapView.then(function () {
                        if (marker) {
                            urlHelper_1.getGraphic(marker).then(function (graphic) {
                                mapView.graphics.add(graphic);
                                mapView.goTo(graphic);
                            });
                        }
                    });
                    return mapView;
                });
            });
        };
        Application.prototype._createWebScene = function (webSceneItem, config, settings) {
            return itemHelper_1.createWebSceneFromItem(webSceneItem).then(function (map) {
                var urlViewProperties = {
                    ui: { components: urlHelper_1.getComponents(config.components) },
                    camera: urlHelper_1.getCamera(config.camera),
                    center: urlHelper_1.getPoint(config.center),
                    zoom: urlHelper_1.getZoom(config.level),
                    extent: urlHelper_1.getExtent(config.extent),
                };
                var basemapUrl = config.basemapUrl, basemapReferenceUrl = config.basemapReferenceUrl, marker = config.marker;
                if (basemapUrl) {
                    urlHelper_1.getBasemap(basemapUrl, basemapReferenceUrl).then(function (basemap) {
                        map.basemap = basemap;
                    });
                }
                var viewProperties = __assign({ map: map, container: settings.webscene.containerId }, urlViewProperties);
                return requireUtils.when(require, "esri/views/SceneView").then(function (SceneView) {
                    var sceneView = new SceneView(viewProperties);
                    sceneView.then(function () {
                        if (marker) {
                            urlHelper_1.getGraphic(marker).then(function (graphic) {
                                sceneView.graphics.add(graphic);
                                sceneView.goTo(graphic);
                            });
                        }
                    });
                    return sceneView;
                });
            });
        };
        Application.prototype._createGroupGallery = function (groupInfoItem, groupItems) {
            if (!groupInfoItem || !groupItems) {
                return;
            }
            var listItems = groupItems.map(function (item) {
                return "<li>" + item.title + "</li>";
            });
            var listHTML = listItems.join("");
            return "<h1>" + groupInfoItem.title + "</h1><ol>" + listHTML + "</ol>";
        };
        return Application;
    }());
    exports.default = Application;
});
//# sourceMappingURL=application.js.map