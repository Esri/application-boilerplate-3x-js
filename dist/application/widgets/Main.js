/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "esri/core/tsSupport/declareExtendsHelper", "esri/core/tsSupport/decorateHelper", "esri/core/accessorSupport/decorators", "esri/widgets/Widget", "esri/widgets/support/widget", "./CustomApplication"], function (require, exports, __extends, __decorate, decorators_1, Widget, widget_1, CustomApplication_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Main = (function (_super) {
        __extends(Main, _super);
        function Main(boilerplate) {
            var _this = _super.call(this) || this;
            _this.state = {
                boilerplateResult: null,
                loadMessage: "Initializing the boilerplate..",
                loadStatus: "loading"
            };
            _this.handleBoilerplateLoad = _this.handleBoilerplateLoad.bind(_this);
            _this.handleBoilerplateError = _this.handleBoilerplateError.bind(_this);
            _this.handleBoilerplateProgress = _this.handleBoilerplateProgress.bind(_this);
            _this.boilerplate = boilerplate;
            _this.boilerplate.then(_this.handleBoilerplateLoad, _this.handleBoilerplateError, _this.handleBoilerplateProgress);
            return _this;
        }
        Main.prototype.render = function () {
            if (this.state.loadStatus === "loaded") {
                return (widget_1.jsxFactory.createElement("div", { id: "myDiv" }, CustomApplication_1.default(this.state.boilerplateResult).render()));
            }
            else if (this.state.loadStatus === "failed") {
                return (widget_1.jsxFactory.createElement("h3", { class: "center-style" }, "Failed to load the boilerplate."));
            }
            return (widget_1.jsxFactory.createElement("div", { class: "grid-container leader-1" },
                widget_1.jsxFactory.createElement("div", { class: "loader is-active padding-leader-3 padding-trailer-3 center-style", key: "loader" },
                    widget_1.jsxFactory.createElement("div", { class: "loader-bars" }),
                    widget_1.jsxFactory.createElement("div", { bind: this, class: "loader-text" }, this.state.loadMessage))));
        };
        Main.prototype.handleBoilerplateLoad = function (boilerplateResult) {
            this.state = __assign({}, this.state, { boilerplateResult: boilerplateResult, loadStatus: "loaded" });
        };
        Main.prototype.handleBoilerplateError = function (err) {
            this.state = __assign({}, this.state, { loadStatus: "failed" });
        };
        Main.prototype.handleBoilerplateProgress = function (progress) {
            this.state = __assign({}, this.state, { loadMessage: progress.status });
        };
        return Main;
    }(decorators_1.declared(Widget)));
    __decorate([
        decorators_1.property(),
        widget_1.renderable()
    ], Main.prototype, "state", void 0);
    Main = __decorate([
        decorators_1.subclass("esri.widgets.Main")
    ], Main);
    exports.default = Main;
});
//# sourceMappingURL=Main.js.map