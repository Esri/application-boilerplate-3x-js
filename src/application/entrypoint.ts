import Application from 'application/application';
import Boilerplate from 'boilerplate/boilerplate';

export = {
  Application,
  Boilerplate,
  init: (applicationConfigJSON, boilerplateConfigJSON) => {
    const applicationConfig = JSON.parse(applicationConfigJSON);
    const boilerplateConfig = JSON.parse(boilerplateConfigJSON);
    const application = new Application();
    const boilerplate = new Boilerplate(applicationConfig, boilerplateConfig);
    boilerplate.init().then(response => application.init(response));
  }
};
