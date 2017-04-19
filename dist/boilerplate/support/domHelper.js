define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var CSS = {
        isActive: "is-active",
        alert: "alert",
        modifier: "modifier-class",
        errorIcon: "icon-ui-error2",
        error: "boilerplate__error",
        loading: "boilerplate--loading"
    };
    function setPageLocale(locale) {
        document.documentElement.lang = locale;
    }
    exports.setPageLocale = setPageLocale;
    function setPageDirection(direction) {
        var dirNode = document.getElementsByTagName("html")[0];
        dirNode.setAttribute("dir", direction);
    }
    exports.setPageDirection = setPageDirection;
    function setPageTitle(title) {
        document.title = title;
    }
    exports.setPageTitle = setPageTitle;
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
//# sourceMappingURL=domHelper.js.map