import boilerFactory from "boilerplate/boilerFactory";

import Main from "./widgets/Main";

export = (applicationConfigJSON, boilerplateConfigJSON) => {
    const boilerplate = boilerFactory(JSON.parse(applicationConfigJSON), JSON.parse(boilerplateConfigJSON));
    const MainComponent = new Main(boilerplate);
    MainComponent.container = "viewDiv";
};
