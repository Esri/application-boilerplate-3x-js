define(["require", "exports", "dojo/i18n!application/nls/resources.js", "esri/core/requireUtils", "esri/core/promiseUtils", "esri/views/MapView", "boilerplate/support/itemUtils", "application/domHelper", "boilerplate/support/urlUtils"], function (require, exports, i18n, requireUtils, promiseUtils, MapView, itemUtils_1, domHelper_1, urlUtils_1) {
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
            var webMapItem = results.webMapItems && results.webMapItems[0] && results.webMapItems[0].value;
            var webSceneItem = results.webSceneItems && results.webSceneItems[0] && results.webSceneItems[0].value;
            var groupItemsValue = results.groupItems && results.groupItems[0] && results.groupItems[0].value;
            var groupInfoValue = results.groupInfos && results.groupInfos[0] && results.groupInfos[0].value;
            var groupItems = groupItemsValue && groupItemsValue.results;
            var groupInfoItem = groupInfoValue && groupInfoValue.results && groupInfoValue.results[0];
            if (!webMapItem && !webSceneItem && !groupInfoItem) {
                domHelper_1.addPageError(i18n.error, "app:: Could not load an item to display");
                return;
            }
            if (!config.title) {
                config.title = itemUtils_1.getItemTitle(webSceneItem || webMapItem || groupInfoItem);
            }
            domHelper_1.setPageLocale(boilerplate.locale);
            domHelper_1.setPageDirection(boilerplate.direction);
            domHelper_1.setPageTitle(config.title);
            // todo: support multiple webscenes, webmaps, groups.
            if (webMapItem) {
                this._createView(webMapItem, config, settings).then(function (view) {
                    if (config.find) {
                        urlUtils_1.find(config.find, view);
                    }
                    domHelper_1.removePageLoading();
                }).otherwise(function (error) {
                    domHelper_1.addPageError(i18n.error, error.message);
                });
            }
            else if (webSceneItem) {
                this._createView(webSceneItem, config, settings).then(function (view) {
                    if (config.find) {
                        urlUtils_1.find(config.find, view);
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
                urlUtils_1.getBasemap(basemapUrl, basemapReferenceUrl).then(function (basemap) {
                    map.basemap = basemap;
                });
            }
        };
        Application.prototype._addMarker = function (config, view) {
            var marker = config.marker;
            if (marker) {
                urlUtils_1.getGraphic(marker).then(function (graphic) {
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
        Application.prototype._createView = function (item, config, settings) {
            var _this = this;
            var isWebMap = item.type === "Web Map";
            var isWebScene = item.type === "Web Scene";
            if (!isWebMap && !isWebScene) {
                return promiseUtils.reject();
            }
            var createItem = isWebMap ? itemUtils_1.createWebMapFromItem(item) : itemUtils_1.createWebSceneFromItem(item);
            var containerId = isWebMap ? settings.webmap.containerId : settings.webscene.containerId;
            var viewTypePath = isWebMap ? "esri/views/MapView" : "esri/views/SceneView";
            return createItem.then(function (map) {
                _this._setBasemap(config, map);
                var viewProperties = urlUtils_1.getViewProperties(config);
                viewProperties.container = containerId;
                viewProperties.map = map;
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