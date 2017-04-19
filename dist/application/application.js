define(["require", "exports", "dojo/i18n!application/nls/resources.js", "esri/core/requireUtils", "esri/core/promiseUtils", "esri/views/MapView", "boilerplate/support/itemUtils", "boilerplate/support/urlUtils", "boilerplate/support/domHelper"], function (require, exports, i18n, requireUtils, promiseUtils, MapView, itemUtils_1, urlUtils_1, domHelper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /// <amd-dependency path="dojo/i18n!application/nls/resources.js" name="i18n" />
    var Application = (function () {
        function Application() {
            // todo: make this simplfied with options.
            // todo: use sass
            // todo: setup grunt watcher?
            // todo: documentation
            // todo: have JC review?
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
            var _this = this;
            if (!boilerplate) {
                domHelper_1.addPageError({
                    title: i18n.error,
                    message: "Boilerplate is not defined"
                });
                return;
            }
            domHelper_1.setPageLocale(boilerplate.locale);
            domHelper_1.setPageDirection(boilerplate.direction);
            this.boilerplate = boilerplate;
            var config = boilerplate.config, results = boilerplate.results, settings = boilerplate.settings;
            var webMapItems = results.webMapItems, webSceneItems = results.webSceneItems;
            var validWebMaps = webMapItems.map(function (response) {
                return response.value;
            });
            var validWebScenes = webSceneItems.map(function (response) {
                return response.value;
            });
            var firstItem = validWebMaps[0] || validWebScenes[0];
            if (!firstItem) {
                domHelper_1.addPageError({
                    title: i18n.error,
                    message: "Could not load an item to display"
                });
                return;
            }
            domHelper_1.removePageLoading();
            config.title = !config.title ? itemUtils_1.getItemTitle(firstItem) : "";
            domHelper_1.setPageTitle(config.title);
            var viewContainerNode = document.getElementById("viewContainer");
            var viewNodes = [];
            validWebMaps.forEach(function (webmap) {
                var viewNode = document.createElement("div");
                viewNodes.push(viewNode);
                _this._createView(webmap, config, viewNode);
            });
            validWebScenes.forEach(function (webscene) {
                var viewNode = document.createElement("div");
                viewNodes.push(viewNode);
                _this._createView(webscene, config, viewNode);
            });
            viewNodes.forEach(function (viewNode) {
                viewContainerNode.appendChild(viewNode);
            });
        };
        //--------------------------------------------------------------------------
        //
        //  Private Methods
        //
        //--------------------------------------------------------------------------
        Application.prototype._setBasemap = function (config, map) {
            var basemapUrl = config.basemapUrl, basemapReferenceUrl = config.basemapReferenceUrl;
            if (!basemapUrl) {
                return;
            }
            urlUtils_1.getBasemap(basemapUrl, basemapReferenceUrl).then(function (basemap) {
                map.basemap = basemap;
            });
        };
        Application.prototype._addMarker = function (config, view) {
            var marker = config.marker;
            if (!marker) {
                return;
            }
            urlUtils_1.getGraphic(marker).then(function (graphic) {
                view.graphics.add(graphic);
                if (view instanceof MapView) {
                    view.goTo(graphic);
                }
                else {
                    view.goTo(graphic);
                }
            });
        };
        Application.prototype._createView = function (item, config, node) {
            var _this = this;
            var isWebMap = item.type === "Web Map";
            var isWebScene = item.type === "Web Scene";
            if (!isWebMap && !isWebScene) {
                return promiseUtils.reject();
            }
            var createItem = isWebMap ? itemUtils_1.createWebMapFromItem(item) : itemUtils_1.createWebSceneFromItem(item);
            var viewTypePath = isWebMap ? "esri/views/MapView" : "esri/views/SceneView";
            return createItem.then(function (map) {
                _this._setBasemap(config, map);
                var viewProperties = urlUtils_1.getViewProperties(config);
                viewProperties.container = node;
                viewProperties.map = map;
                return requireUtils.when(require, viewTypePath).then(function (ViewType) {
                    var view = new ViewType(viewProperties);
                    view.then(function () {
                        _this._addMarker(config, view);
                        if (config.find) {
                            urlUtils_1.find(config.find, view);
                        }
                    });
                    return view;
                });
            });
        };
        return Application;
    }());
    exports.default = Application;
});
//# sourceMappingURL=application.js.map