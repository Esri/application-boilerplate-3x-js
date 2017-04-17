define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var CSS = {
        loading: "boilerplate--loading",
        error: "boilerplate--error",
        errorIcon: "esri-icon-notice-round"
    };
    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------
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
    function addPageError(title, message) {
        removePageLoading();
        document.body.classList.add(CSS.error);
        var node = document.getElementById("loading_message");
        if (node) {
            node.innerHTML = "<h1><span class=\"" + CSS.errorIcon + "\"></span> " + title + "</h1><p>" + message + "</p>";
        }
    }
    exports.addPageError = addPageError;
});
//# sourceMappingURL=domHelper.js.map