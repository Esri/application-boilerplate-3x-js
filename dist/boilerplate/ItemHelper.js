define(["require", "exports", "dojo/Deferred", "esri/WebMap", "esri/WebScene"], function (require, exports, Deferred, WebMap, WebScene) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ItemHelper = (function () {
        function ItemHelper() {
        }
        ItemHelper.prototype.createWebMap = function (item) {
            var deferred = new Deferred();
            if (!item) {
                deferred.reject(new Error("ItemHelper:: WebMap data does not exist."));
            }
            else if (item.data instanceof Error) {
                deferred.reject(item.data);
            }
            else {
                var wm = void 0;
                if (item.data) {
                    wm = new WebMap({
                        portalItem: item.data
                    });
                }
                if (!wm) {
                    deferred.reject(new Error("ItemHelper:: WebMap does not have usable data."));
                }
                else {
                    deferred.resolve(wm);
                }
            }
            return deferred.promise;
        };
        ItemHelper.prototype.createWebScene = function (item) {
            var deferred = new Deferred();
            if (!item) {
                deferred.reject(new Error("ItemHelper:: WebScene data does not exist."));
            }
            else if (item.data instanceof Error) {
                deferred.reject(item.data);
            }
            else {
                var ws = void 0;
                if (item.data) {
                    ws = new WebScene({
                        portalItem: item.data
                    });
                }
                else if (item.json) {
                    ws = WebScene.fromJSON(item.json.itemData);
                    ws.portalItem = item.json.item;
                }
                if (!ws) {
                    deferred.reject(new Error("ItemHelper:: WebScene does not have usable data."));
                }
                else {
                    deferred.resolve(ws);
                }
            }
            return deferred.promise;
        };
        return ItemHelper;
    }());
    exports.default = ItemHelper;
});
//# sourceMappingURL=ItemHelper.js.map