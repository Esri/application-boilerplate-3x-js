define(["require", "exports", "boilerplate/boilerFactory", "./widgets/Main"], function (require, exports, boilerFactory_1, Main_1) {
    "use strict";
    return function (applicationConfigJSON, boilerplateConfigJSON) {
        var boilerplate = boilerFactory_1.default(JSON.parse(applicationConfigJSON), JSON.parse(boilerplateConfigJSON));
        var MainComponent = new Main_1.default(boilerplate);
        MainComponent.container = "viewDiv";
    };
});
//# sourceMappingURL=entrypoint.js.map