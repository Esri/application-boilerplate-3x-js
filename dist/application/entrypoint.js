define(["require", "exports", "application/application", "boilerplate/boilerplate"], function (require, exports, application_1, boilerplate_1) {
    "use strict";
    return {
        Application: application_1.default,
        Boilerplate: boilerplate_1.default,
        init: function (configSettings, boilerplateSettings) {
            var application = new application_1.default();
            var boilerplate = new boilerplate_1.default(JSON.parse(configSettings), JSON.parse(boilerplateSettings));
            boilerplate.init().then(function (boilerplateResponse) {
                application.init(boilerplateResponse);
            });
        }
    };
});
//# sourceMappingURL=entrypoint.js.map