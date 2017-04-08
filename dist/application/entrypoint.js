define(["require", "exports", "application/Application", "boilerplate/Boilerplate"], function (require, exports, Application_1, Boilerplate_1) {
    "use strict";
    return {
        Application: Application_1.default,
        Boilerplate: Boilerplate_1.default,
        init: function (applicationConfigJSON, boilerplateConfigJSON) {
            var application = new Application_1.default();
            var boilerplate = new Boilerplate_1.default(JSON.parse(applicationConfigJSON), JSON.parse(boilerplateConfigJSON));
            boilerplate.load().then(function (response) { return application.init(response); });
        }
    };
});
//# sourceMappingURL=entrypoint.js.map