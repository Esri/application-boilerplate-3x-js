define(["require", "exports", "dojo/i18n!config/nls/resources.js", "dojo/_base/lang", "dojo/dom", "dojo/dom-attr", "esri/views/MapView", "esri/views/SceneView", "boilerplate/ItemHelper", "boilerplate/UrlParamHelper"], function (require, exports, i18n, lang, dom, domAttr, MapView, SceneView, ItemHelper_1, UrlParamHelper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /// <amd-dependency path='dojo/i18n!config/nls/resources.js' name='i18n' />
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
            this.urlParamHelper = null;
            this.itemHelper = null;
        }
        Application.prototype.init = function (boilerplateResponse) {
            if (boilerplateResponse) {
                this.direction = boilerplateResponse.direction;
                this.config = boilerplateResponse.config;
                this.settings = boilerplateResponse.settings;
                var boilerplateResults = boilerplateResponse.results;
                var webMapItem = boilerplateResults.webMapItem;
                var webSceneItem = boilerplateResults.webSceneItem;
                var groupData = boilerplateResults.group;
                document.documentElement.lang = boilerplateResponse.locale;
                this.urlParamHelper = new UrlParamHelper_1.default();
                this.itemHelper = new ItemHelper_1.default();
                this._setDirection();
                if (webMapItem) {
                    this._createWebMap(webMapItem);
                }
                else if (webSceneItem) {
                    this._createWebScene(webSceneItem);
                }
                else if (groupData) {
                    this._createGroupGallery(groupData);
                }
                else {
                    this.reportError(new Error("app:: Could not load an item to display"));
                }
            }
            else {
                this.reportError(new Error("app:: Boilerplate is not defined"));
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
            var node = dom.byId("loading_message");
            if (node) {
                node.innerHTML = "<h1><span class=\"" + CSS.errorIcon + "\"></span> " + i18n.error + "</h1><p>" + error.message + "</p>";
            }
            return error;
        };
        Application.prototype._setDirection = function () {
            var direction = this.direction;
            var dirNode = document.getElementsByTagName("html")[0];
            domAttr.set(dirNode, "dir", direction);
        };
        Application.prototype._ready = function () {
            document.body.removeAttribute('class');
            document.title = this.config.title;
        };
        Application.prototype._createWebMap = function (webMapItem) {
            var _this = this;
            this.itemHelper.createWebMap(webMapItem).then(function (map) {
                var viewProperties = {
                    map: map,
                    container: _this.settings.webmap.containerId
                };
                if (!_this.config.title && map.portalItem && map.portalItem.title) {
                    _this.config.title = map.portalItem.title;
                }
                lang.mixin(viewProperties, _this.urlParamHelper.getViewProperties(_this.config));
                var view = new MapView(viewProperties);
                view.then(function (response) {
                    _this.urlParamHelper.addToView(view, _this.config);
                    _this._ready();
                }, _this.reportError);
            }, this.reportError);
        };
        Application.prototype._createWebScene = function (webSceneItem) {
            var _this = this;
            this.itemHelper.createWebScene(webSceneItem).then(function (map) {
                var viewProperties = {
                    map: map,
                    container: _this.settings.webscene.containerId
                };
                if (!_this.config.title && map.portalItem && map.portalItem.title) {
                    _this.config.title = map.portalItem.title;
                }
                lang.mixin(viewProperties, _this.urlParamHelper.getViewProperties(_this.config));
                var view = new SceneView(viewProperties);
                view.then(function (response) {
                    _this.urlParamHelper.addToView(view, _this.config);
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
                var html_1 = "";
                html_1 += "<h1>" + info.title + "</h1>";
                html_1 += "<ol>";
                items.forEach(function (item) {
                    html_1 += "<li>" + item.title + "</li>";
                });
                html_1 += "</ol>";
                document.body.innerHTML = html_1;
            }
        };
        return Application;
    }());
    exports.default = Application;
});
//# sourceMappingURL=application.js.map