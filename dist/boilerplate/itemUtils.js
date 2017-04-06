define(["require", "exports", "esri/core/requireUtils"], function (require, exports, requireUtils) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------
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
});
//# sourceMappingURL=itemUtils.js.map