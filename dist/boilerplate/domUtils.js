define(["require", "exports", "dojo/i18n!application/nls/resources.js"], function (require, exports, i18n) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /// <amd-dependency path="dojo/i18n!application/nls/resources.js" name="i18n" />
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
    function addPageError(error) {
        removePageLoading();
        document.body.classList.add(CSS.error);
        var node = document.getElementById("loading_message");
        if (node) {
            node.innerHTML = "<h1><span class=\"" + CSS.errorIcon + "\"></span> " + i18n.error + "</h1><p>" + error.message + "</p>";
        }
    }
    exports.addPageError = addPageError;
});
//# sourceMappingURL=domUtils.js.map