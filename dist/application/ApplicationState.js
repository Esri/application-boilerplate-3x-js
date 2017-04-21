define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var CSS = {
        // calcite
        isActive: "is-active",
        alert: "alert",
        modifier: "modifier-class",
        errorIcon: "icon-ui-error2",
        // boilerplate
        error: "boilerplate__error",
        loading: "boilerplate--loading"
    };
    function removePageLoading() {
        document.body.classList.remove(CSS.loading);
    }
    exports.removePageLoading = removePageLoading;
    function addPageError(args) {
        removePageLoading();
        var errorNode = document.createElement("div");
        errorNode.className = CSS.error;
        errorNode.innerHTML = "\n    <div class=\"" + CSS.alert + " " + CSS.modifier + " " + CSS.isActive + "\">\n      <h2><span class=\"" + CSS.errorIcon + "\"></span> " + args.title + "</h2>\n      <p>" + args.message + "</p>\n    </div>\n  ";
        document.body.insertBefore(errorNode, document.body.firstChild);
    }
    exports.addPageError = addPageError;
});
//# sourceMappingURL=ApplicationState.js.map