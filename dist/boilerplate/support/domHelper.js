//--------------------------------------------------------------------------
//
//  Public Methods
//
//--------------------------------------------------------------------------
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
});
//# sourceMappingURL=domHelper.js.map