define(["require", "exports", "application/application", "boilerplate/boilerplate"], function (require, exports, application_1, boilerplate_1) {
    "use strict";
    return {
        Application: application_1.default,
        Boilerplate: boilerplate_1.default,
        init: function (applicationConfigJSON, boilerplateConfigJSON) {
            var application = new application_1.default();
            var boilerplate = new boilerplate_1.default(JSON.parse(applicationConfigJSON), JSON.parse(boilerplateConfigJSON));
            boilerplate.init().then(function (response) { return application.init(response); });
        }
    };
});
//# sourceMappingURL=entrypoint.js.map