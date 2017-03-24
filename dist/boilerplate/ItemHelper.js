define(["require", "exports", "esri/core/promiseUtils", "esri/WebMap", "esri/WebScene"], function (require, exports, promiseUtils, WebMap, WebScene) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ItemHelper = (function () {
        function ItemHelper() {
        }
        ItemHelper.prototype.createWebMap = function (item) {
            if (!item) {
                return promiseUtils.reject(new Error("ItemHelper:: WebMap data does not exist."));
            }
            if (item.data instanceof Error) {
                return promiseUtils.reject(item.data);
            }
            var wm = this._createWebMap(item);
            return wm ? promiseUtils.resolve(wm) : promiseUtils.reject(new Error("ItemHelper:: WebMap does not have usable data."));
        };
        ItemHelper.prototype.createWebScene = function (item) {
            if (!item) {
                return promiseUtils.reject(new Error("ItemHelper:: WebScene data does not exist."));
            }
            if (item.data instanceof Error) {
                return promiseUtils.reject(item.data);
            }
            var ws = this._createWebScene(item);
            return ws ? promiseUtils.resolve(ws) : promiseUtils.reject(new Error("ItemHelper:: WebScene does not have usable data."));
        };
        ItemHelper.prototype._createWebMap = function (item) {
            if (item.data) {
                return new WebMap({
                    portalItem: item.data
                });
            }
            // todo: fix
            // if (item.json) {
            //   const wm = WebMap.fromJSON(item.json.itemData);
            //   wm.portalItem = item.json.item;
            //   return wm;
            // }
        };
        ItemHelper.prototype._createWebScene = function (item) {
            if (item.data) {
                return new WebScene({
                    portalItem: item.data
                });
            }
            if (item.json) {
                var ws = WebScene.fromJSON(item.json.itemData);
                ws.portalItem = item.json.item;
                return ws;
            }
        };
        return ItemHelper;
    }());
    exports.default = ItemHelper;
});
//# sourceMappingURL=ItemHelper.js.map