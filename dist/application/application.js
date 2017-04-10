var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
define(["require", "exports", "dojo/i18n!application/nls/resources.js", "esri/core/requireUtils", "boilerplate/itemUtils", "boilerplate/domUtils", "boilerplate/urlUtils"], function (require, exports, i18n, requireUtils, itemUtils_1, domUtils_1, urlUtils_1) {
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
                domUtils_1.addPageError(new Error("app:: Boilerplate is not defined"));
                return;
            }
            this.boilerplate = boilerplate;
            var config = boilerplate.config, results = boilerplate.results, settings = boilerplate.settings;
            var webMapItem = results.webMapItem.value;
            var webSceneItem = results.webSceneItem.value;
            var groupItems = results.groupItems.value;
            var groupInfo = results.groupInfo.value;
            if (!webMapItem && !webSceneItem && !groupItems) {
                domUtils_1.addPageError(new Error("app:: Could not load an item to display"));
                return;
            }
            domUtils_1.setPageLocale(boilerplate.locale);
            domUtils_1.setPageDirection(boilerplate.direction);
            // todo: support multiple webscenes, webmaps, groups.
            if (webMapItem) {
                config.title = itemUtils_1.getItemTitle(webMapItem) || config.title;
                this._createWebMap(webMapItem, config, settings).then(function (view) {
                    urlUtils_1.find(config.find, view);
                    domUtils_1.setPageTitle(config.title);
                    domUtils_1.removePageLoading();
                }).otherwise(domUtils_1.addPageError);
            }
            else if (webSceneItem) {
                config.title = itemUtils_1.getItemTitle(webSceneItem) || config.title;
                this._createWebScene(webSceneItem, config, settings).then(function (view) {
                    urlUtils_1.find(config.find, view);
                    domUtils_1.setPageTitle(config.title);
                    domUtils_1.removePageLoading();
                }).otherwise(domUtils_1.addPageError);
            }
            else if (groupItems) {
                var galleryHTML = this._createGroupGallery(groupInfo, groupItems);
                if (galleryHTML instanceof Error) {
                    domUtils_1.addPageError(galleryHTML);
                }
                else {
                    document.body.innerHTML = galleryHTML;
                    domUtils_1.setPageTitle(config.title);
                    domUtils_1.removePageLoading();
                }
            }
        };
        //--------------------------------------------------------------------------
        //
        //  Private Methods
        //
        //--------------------------------------------------------------------------
        Application.prototype._createWebMap = function (webMapItem, config, settings) {
            return itemUtils_1.createWebMapFromItem(webMapItem).then(function (map) {
                var urlViewProperties = {
                    camera: urlUtils_1.getCamera(config.camera),
                    center: urlUtils_1.getPoint(config.center),
                    zoom: urlUtils_1.getZoom(config.level),
                    extent: urlUtils_1.getExtent(config.extent)
                };
                var uiComponents = urlUtils_1.getComponents(config.components);
                if (uiComponents) {
                    // todo: fix in new typings
                    // urlViewProperties.ui = {
                    //   components: uiComponents
                    // };
                }
                var basemap = urlUtils_1.getBasemap(config.basemapUrl, config.basemapReferenceUrl).then(function (basemap) {
                    if (basemap) {
                        map.basemap = basemap;
                    }
                });
                var viewProperties = __assign({ map: map, container: settings.webmap.containerId }, urlViewProperties);
                return requireUtils.when(require, "esri/views/MapView").then(function (MapView) {
                    var mapView = new MapView(viewProperties);
                    mapView.then(function () {
                        var graphic = urlUtils_1.getGraphic(config.marker).then(function (graphic) {
                            if (graphic) {
                                mapView.graphics.add(graphic);
                                mapView.goTo(graphic);
                            }
                        });
                    });
                    return mapView;
                });
            });
        };
        Application.prototype._createWebScene = function (webSceneItem, config, settings) {
            return itemUtils_1.createWebSceneFromItem(webSceneItem).then(function (map) {
                var urlViewProperties = {
                    ui: { components: urlUtils_1.getComponents(config.components) },
                    camera: urlUtils_1.getCamera(config.camera),
                    center: urlUtils_1.getPoint(config.center),
                    zoom: urlUtils_1.getZoom(config.level),
                    extent: urlUtils_1.getExtent(config.extent)
                };
                var basemap = urlUtils_1.getBasemap(config.basemapUrl, config.basemapReferenceUrl).then(function (basemap) {
                    if (basemap) {
                        map.basemap = basemap;
                    }
                });
                var viewProperties = __assign({ map: map, container: settings.webscene.containerId }, urlViewProperties);
                return requireUtils.when(require, "esri/views/SceneView").then(function (SceneView) {
                    var sceneView = new SceneView(viewProperties);
                    sceneView.then(function () {
                        var graphic = urlUtils_1.getGraphic(config.marker).then(function (graphic) {
                            if (graphic) {
                                sceneView.graphics.add(graphic);
                                sceneView.goTo(graphic);
                            }
                        });
                    });
                    return sceneView;
                });
            });
        };
        Application.prototype._createGroupGallery = function (groupInfo, groupItems) {
            if (!groupInfo || !groupItems || groupInfo.total === 0 || groupInfo instanceof Error) {
                return new Error("app:: group data does not exist.");
            }
            var info = groupItems.results[0];
            var items = groupItems.results;
            if (info && items) {
                var listItems = items.map(function (item) {
                    return "<li>" + item.title + "</li>";
                });
                var listHTML = listItems.join("");
                var html = "<h1>" + info.title + "</h1><ol>" + listHTML + "</ol>";
                return html;
            }
        };
        return Application;
    }());
    exports.default = Application;
});
//# sourceMappingURL=application.js.map