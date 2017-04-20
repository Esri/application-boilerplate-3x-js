define(["require", "exports", "dojo/i18n!application/nls/resources.js", "boilerplate/support/domHelper"], function (require, exports, i18n, domHelper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /// <amd-dependency path="dojo/i18n!application/nls/resources.js" name="i18n" />
    var Application = (function () {
        function Application() {
            //--------------------------------------------------------------------------
            //
            //  Lifecycle
            //
            //--------------------------------------------------------------------------
            //--------------------------------------------------------------------------
            //
            //  Properties
            //
            //--------------------------------------------------------------------------
            //----------------------------------
            //  boilerplate
            //----------------------------------
            this.boilerplate = null;
            //--------------------------------------------------------------------------
            //
            //  Private Methods
            //
            //--------------------------------------------------------------------------
        }
        //--------------------------------------------------------------------------
        //
        //  Public Methods
        //
        //--------------------------------------------------------------------------
        Application.prototype.init = function (boilerplate) {
            console.log(boilerplate);
            domHelper_1.removePageLoading();
        };
        return Application;
    }());
    exports.default = Application;
});
//# sourceMappingURL=Application.js.map