define(["require", "exports", "dojo/i18n!application/nls/resources.js", "boilerplate/support/domHelper"], function (require, exports, i18n, domHelper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /// <amd-dependency path="dojo/i18n!application/nls/resources.js" name="i18n" />
    var GroupExample = (function () {
        function GroupExample() {
            //--------------------------------------------------------------------------
            //
            //  Properties
            //
            //--------------------------------------------------------------------------
            //----------------------------------
            //  boilerplate
            //----------------------------------
            this.boilerplate = null;
        }
        //--------------------------------------------------------------------------
        //
        //  Public Methods
        //
        //--------------------------------------------------------------------------
        GroupExample.prototype.init = function (boilerplate) {
            domHelper_1.removePageLoading();
            var results = boilerplate.results;
            var groupInfos = results.groupInfos[0];
            var groupItems = results.groupItems[0];
            var groupInfoResults = groupInfos.value && groupInfos.value.results;
            var groupItemsResults = groupItems.value && groupItems.value.results;
            var groupInfo = groupItemsResults && groupInfoResults[0];
            if (!groupInfos || !groupItems || !groupInfoResults || !groupItemsResults || !groupInfo) {
                return;
            }
            var html = "";
            html += "<h1>" + groupInfo.title + "</h1>";
            html += "<ol>";
            groupItemsResults.forEach(function (item) {
                html += "<li>" + item.title + "</li>";
            });
            html += "</ol>";
            var groupNode = document.getElementById("groupContainer");
            groupNode.innerHTML = html;
        };
        return GroupExample;
    }());
    exports.default = GroupExample;
});
//# sourceMappingURL=Group.js.map