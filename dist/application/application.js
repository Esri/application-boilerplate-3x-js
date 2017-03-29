var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
define(["require", "exports", "dojo/i18n!application/nls/resources.js", "esri/views/MapView", "esri/views/SceneView", "boilerplate/ItemHelper", "boilerplate/UrlParamHelper"], function (require, exports, i18n, MapView, SceneView, ItemHelper_1, UrlParamHelper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /// <amd-dependency path="dojo/i18n!application/nls/resources.js" name="i18n" />
    var CSS = {
        loading: "boilerplate--loading",
        error: "boilerplate--error",
        errorIcon: "esri-icon-notice-round"
    };
    var Application = (function () {
        function Application() {
            this.config = null;
            this.direction = null;
            this.settings = null;
        }
        Application.prototype.init = function (boilerplateResponse) {
            if (!boilerplateResponse) {
                this.reportError(new Error("app:: Boilerplate is not defined"));
            }
            this.direction = boilerplateResponse.direction;
            this.config = boilerplateResponse.config;
            this.settings = boilerplateResponse.settings;
            var boilerplateResults = boilerplateResponse.results;
            var webMapItem = boilerplateResults.webMapItem;
            var webSceneItem = boilerplateResults.webSceneItem;
            var groupData = boilerplateResults.group;
            this._setDocumentLocale(boilerplateResponse.locale);
            this._setDirection(boilerplateResponse.direction);
            // todo: support multiple webscenes, webmaps, groups.
            // todo: allow all at once
            if (webMapItem) {
                this._createWebMap(webMapItem);
            }
            else if (webSceneItem) {
                this._createWebScene(webSceneItem);
            }
            else if (groupData) {
                this._createGroupGallery(groupData);
            }
            if (!webMapItem && !webSceneItem && !groupData) {
                this.reportError(new Error("app:: Could not load an item to display"));
            }
        };
        Application.prototype.reportError = function (error) {
            // remove loading class from body
            document.body.removeAttribute('class');
            document.body.className = CSS.error;
            // an error occurred - notify the user. In this example we pull the string from the
            // resource.js file located in the nls folder because we've set the application up
            // for localization. If you don't need to support multiple languages you can hardcode the
            // strings here and comment out the call in index.html to get the localization strings.
            // set message
            var node = document.getElementById("loading_message");
            if (node) {
                node.innerHTML = "<h1><span class=\"" + CSS.errorIcon + "\"></span> " + i18n.error + "</h1><p>" + error.message + "</p>";
            }
            return error;
        };
        Application.prototype._setDocumentLocale = function (locale) {
            document.documentElement.lang = locale;
        };
        Application.prototype._setDirection = function (direction) {
            var dirNode = document.getElementsByTagName("html")[0];
            dirNode.setAttribute("dir", direction);
        };
        Application.prototype._ready = function () {
            document.body.removeAttribute('class');
            document.title = this.config.title;
        };
        Application.prototype._createWebMap = function (webMapItem) {
            var _this = this;
            ItemHelper_1.createWebMapFromItem(webMapItem).then(function (map) {
                var urlViewProperties = UrlParamHelper_1.getUrlViewProperties(_this.config); // todo: fix interface
                var viewProperties = __assign({ map: map, container: _this.settings.webmap.containerId }, urlViewProperties);
                if (!_this.config.title && map.portalItem && map.portalItem.title) {
                    _this.config.title = map.portalItem.title;
                }
                var view = new MapView(viewProperties);
                view.then(function () {
                    UrlParamHelper_1.setConfigItemsOnView(view, _this.config);
                    _this._ready();
                }, _this.reportError);
            }, this.reportError);
        };
        Application.prototype._createWebScene = function (webSceneItem) {
            var _this = this;
            ItemHelper_1.createWebSceneFromItem(webSceneItem).then(function (map) {
                console.log(map);
                // todo: not getting in here
                var urlViewProperties = UrlParamHelper_1.getUrlViewProperties(_this.config); // todo: fix interface
                var viewProperties = __assign({ map: map, container: _this.settings.webscene.containerId }, urlViewProperties);
                if (!_this.config.title && map.portalItem && map.portalItem.title) {
                    _this.config.title = map.portalItem.title;
                }
                var view = new SceneView(viewProperties);
                view.then(function () {
                    UrlParamHelper_1.setConfigItemsOnView(view, _this.config);
                    _this._ready();
                }, _this.reportError);
            }, this.reportError);
        };
        Application.prototype._createGroupGallery = function (groupData) {
            var groupInfoData = groupData.infoData;
            var groupItemsData = groupData.itemsData;
            if (!groupInfoData || !groupItemsData || groupInfoData.total === 0 || groupInfoData instanceof Error) {
                this.reportError(new Error("app:: group data does not exist."));
                return;
            }
            var info = groupInfoData.results[0];
            var items = groupItemsData.results;
            this._ready();
            if (info && items) {
                var listNodes = items.map(function (item) {
                    return "<li>" + item.title + "</li>";
                });
                var html = "\n        <h1>" + info.title + "</h1>\n        <ol>\n        " + listNodes + "\n        </ol>\n      ";
                // let html = "";
                // html += "<h1>" + info.title + "</h1>";
                // html += "<ol>";
                // items.forEach((item) => {
                //   html += "<li>" + item.title + "</li>";
                // });
                // html += "</ol>";
                document.body.innerHTML = html;
            }
        };
        return Application;
    }());
    exports.default = Application;
});
//# sourceMappingURL=application.js.map