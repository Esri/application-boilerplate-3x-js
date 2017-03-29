define(["require", "exports", "esri/core/promiseUtils", "esri/core/requireUtils"], function (require, exports, promiseUtils, requireUtils) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createWebMapFromItem(item) {
        if (!item) {
            return promiseUtils.reject(new Error("ItemHelper:: WebMap data does not exist."));
        }
        if (item.data instanceof Error) {
            return promiseUtils.reject(item.data);
        }
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
    exports.createWebMapFromItem = createWebMapFromItem;
    function createWebSceneFromItem(item) {
        if (!item) {
            return promiseUtils.reject(new Error("ItemHelper:: WebScene data does not exist."));
        }
        if (item.data instanceof Error) {
            return promiseUtils.reject(item.data);
        }
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
    exports.createWebSceneFromItem = createWebSceneFromItem;
});
//# sourceMappingURL=ItemHelper.js.map