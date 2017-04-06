var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
define(["require", "exports", "dojo/i18n!application/nls/resources.js", "esri/core/requireUtils", "boilerplate/itemUtils", "boilerplate/urlUtils"], function (require, exports, i18n, requireUtils, itemUtils_1, urlUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /// <amd-dependency path="dojo/i18n!application/nls/resources.js" name="i18n" />
    var CSS = {
        loading: "boilerplate--loading",
        error: "boilerplate--error",
        errorIcon: "esri-icon-notice-round"
    };
    // todo: should this be a class?
    var Application = (function () {
        function Application() {
            //--------------------------------------------------------------------------
            //
            //  Properties
            //
            //--------------------------------------------------------------------------
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
                this.reportError(new Error("app:: Boilerplate is not defined"));
                return;
            }
            this.boilerplate = boilerplate;
            // todo
            var boilerplateResults = boilerplate.results;
            var webMapItem = boilerplateResults.webMapItem.value;
            var webSceneItem = boilerplateResults.webSceneItem.value;
            var groupItems = boilerplateResults.groupItems.value;
            var groupInfo = boilerplateResults.groupInfo.value;
            if (!webMapItem && !webSceneItem && !groupItems) {
                this.reportError(new Error("app:: Could not load an item to display"));
                return;
            }
            this._setDocumentLocale(boilerplate.locale);
            this._setDirection(boilerplate.direction);
            var config = this.boilerplate.config;
            var settings = this.boilerplate.settings;
            // todo
            if (!config.title && webMapItem && webMapItem.title) {
                config.title = webMapItem.title;
            }
            if (!config.title && webSceneItem && webSceneItem.title) {
                config.title = webSceneItem.title;
            }
            // todo: support multiple webscenes, webmaps, groups.
            if (webMapItem) {
                this._createWebMap(webMapItem, config, settings).then(function (view) {
                    urlUtils_1.setConfigItemsOnView(view, config);
                    _this._setTitle(config.title);
                    _this._removeLoading();
                }).otherwise(this.reportError);
            }
            else if (webSceneItem) {
                this._createWebScene(webSceneItem, config, settings).then(function (view) {
                    urlUtils_1.setConfigItemsOnView(view, config);
                    _this._setTitle(config.title);
                    _this._removeLoading();
                }).otherwise(this.reportError);
            }
            else if (groupItems) {
                var galleryHTML = this._createGroupGallery(groupInfo, groupItems);
                if (galleryHTML instanceof Error) {
                    this.reportError(galleryHTML);
                }
                else {
                    document.body.innerHTML = galleryHTML;
                    this._setTitle(config.title);
                    this._removeLoading();
                }
            }
        };
        Application.prototype.reportError = function (error) {
            this._removeLoading();
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
        //--------------------------------------------------------------------------
        //
        //  Private Methods
        //
        //--------------------------------------------------------------------------
        Application.prototype._setDocumentLocale = function (locale) {
            document.documentElement.lang = locale;
        };
        Application.prototype._setDirection = function (direction) {
            var dirNode = document.getElementsByTagName("html")[0];
            dirNode.setAttribute("dir", direction);
        };
        Application.prototype._setTitle = function (title) {
            document.title = title;
        };
        Application.prototype._removeLoading = function () {
            document.body.className = document.body.className.replace(CSS.loading, "");
        };
        Application.prototype._createWebMap = function (webMapItem, config, settings) {
            return itemUtils_1.createWebMapFromItem(webMapItem).then(function (map) {
                var urlViewProperties = urlUtils_1.getUrlViewProperties(config);
                var viewProperties = __assign({ map: map, container: settings.webmap.containerId }, urlViewProperties);
                return requireUtils.when(require, "esri/views/MapView").then(function (MapView) {
                    return new MapView(viewProperties);
                });
            });
        };
        Application.prototype._createWebScene = function (webSceneItem, config, settings) {
            return itemUtils_1.createWebSceneFromItem(webSceneItem).then(function (map) {
                var urlViewProperties = urlUtils_1.getUrlViewProperties(config);
                var viewProperties = __assign({ map: map, container: settings.webscene.containerId }, urlViewProperties);
                return requireUtils.when(require, "esri/views/SceneView").then(function (SceneView) {
                    return new SceneView(viewProperties);
                });
            });
        };
        Application.prototype._createGroupGallery = function (groupInfo, groupItems) {
            if (!groupInfo || !groupItems || groupInfo.total === 0 || groupInfo instanceof Error) {
                return new Error("app:: group data does not exist.");
            }
            var info = groupItems.results[0];
            var items = groupItems.results;
            if (info && items) {
                var listItems = items.map(function (item) {
                    return "<li>" + item.title + "</li>";
                });
                var listHTML = listItems.join("");
                var html = "<h1>" + info.title + "</h1><ol>" + listHTML + "</ol>";
                return html;
            }
        };
        return Application;
    }());
    exports.default = Application;
});
//# sourceMappingURL=application.js.map