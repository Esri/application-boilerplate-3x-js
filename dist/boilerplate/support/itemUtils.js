var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
define(["require", "exports", "esri/core/requireUtils", "esri/core/promiseUtils", "esri/core/watchUtils", "./urlUtils"], function (require, exports, requireUtils, promiseUtils, watchUtils, urlUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------
    function getViewProperties(config) {
        var center = config.center, components = config.components, extent = config.extent, level = config.level, viewpoint = config.viewpoint;
        var ui = components ? { ui: { components: urlUtils_1.getComponents(components) } } : null;
        var cameraProps = viewpoint ? { camera: urlUtils_1.getCamera(viewpoint) } : null;
        var centerProps = center ? { center: urlUtils_1.getPoint(center) } : null;
        var zoomProps = level ? { zoom: urlUtils_1.getZoom(level) } : null;
        var extentProps = extent ? { extent: urlUtils_1.getExtent(extent) } : null;
        var urlViewProperties = __assign({}, ui, cameraProps, centerProps, zoomProps, extentProps);
        return __assign({}, urlViewProperties);
    }
    exports.getViewProperties = getViewProperties;
    function createMap(item) {
        var isWebMap = item.type === "Web Map";
        var isWebScene = item.type === "Web Scene";
        if (!isWebMap && !isWebScene) {
            return promiseUtils.reject();
        }
        return isWebMap ? createWebMapFromItem(item) : createWebSceneFromItem(item);
        ;
    }
    exports.createMap = createMap;
    function createView(map, viewProperties) {
        var isWebMap = map.declaredClass === "esri.WebMap";
        var isWebScene = map.declaredClass === "esri.isWebScene";
        if (!isWebMap && !isWebScene) {
            return promiseUtils.reject();
        }
        var viewTypePath = isWebMap ? "esri/views/MapView" : "esri/views/SceneView";
        viewProperties.map = map;
        return requireUtils.when(require, viewTypePath).then(function (ViewType) {
            return new ViewType(viewProperties);
        });
    }
    exports.createView = createView;
    function createWebMapFromItem(portalItem) {
        return requireUtils.when(require, "esri/WebMap").then(function (WebMap) {
            var wm = new WebMap({
                portalItem: portalItem
            });
            return wm.load();
        });
    }
    exports.createWebMapFromItem = createWebMapFromItem;
    function createWebSceneFromItem(portalItem) {
        return requireUtils.when(require, "esri/WebScene").then(function (WebScene) {
            var ws = new WebScene({
                portalItem: portalItem
            });
            return ws.load();
        });
    }
    exports.createWebSceneFromItem = createWebSceneFromItem;
    function getItemTitle(item) {
        if (item && item.title) {
            return item.title;
        }
    }
    exports.getItemTitle = getItemTitle;
    function setBasemap(map, config) {
        var basemapUrl = config.basemapUrl, basemapReferenceUrl = config.basemapReferenceUrl;
        if (!basemapUrl || !map) {
            return promiseUtils.resolve(map);
        }
        return urlUtils_1.getBasemap(basemapUrl, basemapReferenceUrl).then(function (basemap) {
            map.basemap = basemap;
            return map;
        });
    }
    exports.setBasemap = setBasemap;
    function setGraphic(marker, view) {
        if (!marker || !view) {
            return promiseUtils.resolve();
        }
        return urlUtils_1.getGraphic(marker).then(function (graphic) {
            view.graphics.add(graphic);
            var view2 = view; // todo: Typings will be fixed in next release.
            return view2.goTo(graphic);
        });
    }
    exports.setGraphic = setGraphic;
    function setFindLocation(query, view) {
        // ?find=redlands, ca
        if (!query || !view) {
            return promiseUtils.resolve();
        }
        return requireUtils.when(require, "esri/widgets/Search/SearchViewModel").then(function (SearchViewModel) {
            var searchVM = new SearchViewModel({
                view: view
            });
            return searchVM.search(query).then(function (result) {
                watchUtils.whenFalseOnce(view, "popup.visible", function () { return searchVM.destroy(); });
                return result;
            });
        });
    }
    exports.setFindLocation = setFindLocation;
});
//# sourceMappingURL=itemUtils.js.map