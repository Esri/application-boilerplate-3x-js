define(["require", "exports", "esri/core/promiseUtils", "esri/core/requireUtils"], function (require, exports, promiseUtils, requireUtils) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createWebMap(item) {
        if (!item) {
            return promiseUtils.reject(new Error("ItemHelper:: WebMap data does not exist."));
        }
        if (item.data instanceof Error) {
            return promiseUtils.reject(item.data);
        }
        return this._createWebMap(item);
    }
    exports.createWebMap = createWebMap;
    function createWebScene(item) {
        if (!item) {
            return promiseUtils.reject(new Error("ItemHelper:: WebScene data does not exist."));
        }
        if (item.data instanceof Error) {
            return promiseUtils.reject(item.data);
        }
        return this._createWebScene(item);
    }
    exports.createWebScene = createWebScene;
    function _createWebMap(item) {
        var itemData = item.data;
        var itemJSON = item.json;
        if (!itemData && !itemJSON) {
            return promiseUtils.reject(new Error("ItemHelper:: WebMap does not have usable data."));
        }
        return requireUtils.when(require, "esri/WebMap").then(function (WebMap) {
            if (itemData) {
                return new WebMap({
                    portalItem: itemData
                });
            }
            // todo: fix
            // if (itemJSON) {
            //   const wm = WebMap.fromJSON(itemJSON.itemData);
            //   wm.portalItem = itemJSON.item;
            //   return wm;
            // }
        });
    }
    function _createWebScene(item) {
        var itemData = item.data;
        var itemJSON = item.json;
        if (!itemData && !itemJSON) {
            return promiseUtils.reject(new Error("ItemHelper:: WebScene does not have usable data."));
        }
        return requireUtils.when(require, "esri/WebScene").then(function (WebScene) {
            if (itemData) {
                return new WebScene({
                    portalItem: itemData
                });
            }
            if (itemJSON) {
                var wm = WebScene.fromJSON(itemJSON.itemData);
                wm.portalItem = itemJSON.item;
                return wm;
            }
        });
    }
});
//# sourceMappingURL=ItemHelper.js.map