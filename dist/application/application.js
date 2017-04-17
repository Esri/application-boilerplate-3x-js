var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
define(["require", "exports", "dojo/i18n!application/nls/resources.js", "esri/core/requireUtils", "esri/core/promiseUtils", "esri/views/MapView", "application/itemHelper", "application/domHelper", "application/urlHelper"], function (require, exports, i18n, requireUtils, promiseUtils, MapView, itemHelper_1, domHelper_1, urlHelper_1) {
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
            if (!config.title) {
                config.title = itemHelper_1.getItemTitle(webSceneItem || webMapItem || groupInfoItem);
            }
            domHelper_1.setPageLocale(boilerplate.locale);
            domHelper_1.setPageDirection(boilerplate.direction);
            domHelper_1.setPageTitle(config.title);
            // todo: support multiple webscenes, webmaps, groups.
            if (webMapItem) {
                this._createView(webMapItem, config, settings).then(function (view) {
                    if (config.find) {
                        urlHelper_1.find(config.find, view);
                    }
                    domHelper_1.removePageLoading();
                }).otherwise(function (error) {
                    domHelper_1.addPageError(i18n.error, error.message);
                });
            }
            else if (webSceneItem) {
                this._createView(webSceneItem, config, settings).then(function (view) {
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
        Application.prototype._setBasemap = function (config, map) {
            var basemapUrl = config.basemapUrl, basemapReferenceUrl = config.basemapReferenceUrl;
            if (basemapUrl) {
                urlHelper_1.getBasemap(basemapUrl, basemapReferenceUrl).then(function (basemap) {
                    map.basemap = basemap;
                });
            }
        };
        Application.prototype._addMarker = function (config, view) {
            var marker = config.marker;
            if (marker) {
                urlHelper_1.getGraphic(marker).then(function (graphic) {
                    view.graphics.add(graphic);
                    if (view instanceof MapView) {
                        view.goTo(graphic);
                    }
                    else {
                        view.goTo(graphic);
                    }
                });
            }
        };
        Application.prototype._getViewProperties = function (config, containerId, map) {
            var camera = config.camera, center = config.center, components = config.components, extent = config.extent, level = config.level;
            var ui = components ? { components: urlHelper_1.getComponents(components) } : {};
            var urlViewProperties = {
                ui: ui,
                camera: urlHelper_1.getCamera(camera),
                center: urlHelper_1.getPoint(center),
                zoom: urlHelper_1.getZoom(level),
                extent: urlHelper_1.getExtent(extent)
            };
            return __assign({ map: map, container: containerId }, urlViewProperties);
        };
        Application.prototype._createView = function (item, config, settings) {
            var _this = this;
            var isWebMap = item.type === "Web Map";
            var isWebScene = item.type === "Web Scene";
            if (!isWebMap && !isWebScene) {
                return promiseUtils.reject();
            }
            var createItem = isWebMap ? itemHelper_1.createWebMapFromItem(item) : itemHelper_1.createWebSceneFromItem(item);
            var containerId = isWebMap ? settings.webmap.containerId : settings.webscene.containerId;
            var viewTypePath = isWebMap ? "esri/views/MapView" : "esri/views/SceneView";
            return createItem.then(function (map) {
                _this._setBasemap(config, map);
                var viewProperties = _this._getViewProperties(config, containerId, map);
                return requireUtils.when(require, viewTypePath).then(function (ViewType) {
                    var view = new ViewType(viewProperties);
                    view.then(function () {
                        _this._addMarker(config, view);
                    });
                    return view;
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