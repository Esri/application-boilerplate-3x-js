var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
define(["require", "exports", "dojo/i18n!application/nls/resources.js", "boilerplate/support/itemUtils", "./ApplicationState", "boilerplate/support/domHelper"], function (require, exports, i18n, itemUtils_1, ApplicationState_1, domHelper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /// <amd-dependency path="dojo/i18n!application/nls/resources.js" name="i18n" />
    var MapAndSceneExample = (function () {
        function MapAndSceneExample() {
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
        MapAndSceneExample.prototype.init = function (boilerplate) {
            if (!boilerplate) {
                ApplicationState_1.addPageError({
                    title: i18n.error,
                    message: "Boilerplate is not defined"
                });
                return;
            }
            domHelper_1.setPageLocale(boilerplate.locale);
            domHelper_1.setPageDirection(boilerplate.direction);
            this.boilerplate = boilerplate;
            var config = boilerplate.config, results = boilerplate.results, settings = boilerplate.settings;
            var find = config.find, marker = config.marker;
            var webMapItems = results.webMapItems, webSceneItems = results.webSceneItems;
            var validWebMapItems = webMapItems.map(function (response) {
                return response.value;
            });
            var validWebSceneItems = webSceneItems.map(function (response) {
                return response.value;
            });
            var validItems = validWebMapItems.concat(validWebSceneItems);
            var firstItem = validWebMapItems[0] || validWebSceneItems[0];
            if (!firstItem) {
                ApplicationState_1.addPageError({
                    title: i18n.error,
                    message: "Could not load an item to display"
                });
                return;
            }
            config.title = !config.title ? itemUtils_1.getItemTitle(firstItem) : "";
            domHelper_1.setPageTitle(config.title);
            var viewContainerNode = document.getElementById("viewContainer");
            var defaultViewProperties = itemUtils_1.getViewProperties(config);
            validItems.forEach(function (item) {
                var viewNode = document.createElement("div");
                viewContainerNode.appendChild(viewNode);
                var viewProperties = __assign({ container: viewNode }, defaultViewProperties);
                itemUtils_1.createMap(item)
                    .then(function (map) { return itemUtils_1.setBasemap(map, config)
                    .then(function (map) { return itemUtils_1.createView(map, viewProperties)
                    .then(function (view) { return itemUtils_1.setFindLocation(find, view)
                    .then(function () { return itemUtils_1.setGraphic(marker, view); }); }); }); });
            });
            ApplicationState_1.removePageLoading();
        };
        return MapAndSceneExample;
    }());
    exports.default = MapAndSceneExample;
});
//# sourceMappingURL=MapAndScene.js.map