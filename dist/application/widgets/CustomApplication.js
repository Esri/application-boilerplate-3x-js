define(["require", "exports", "esri/widgets/support/widget"], function (require, exports, widget_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = function (boilerplateResult) {
        console.log(boilerplateResult);
        return {
            render: function () {
                return (widget_1.jsxFactory.createElement("div", { class: "center-style" },
                    widget_1.jsxFactory.createElement("h3", null, "Custom Application"),
                    widget_1.jsxFactory.createElement("h5", null, "(check console for boilerplate results)")));
            }
        };
    };
});
//# sourceMappingURL=CustomApplication.js.map