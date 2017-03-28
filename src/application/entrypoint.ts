import Application from 'application/application';
import Boilerplate from 'boilerplate/boilerplate';

export = {
  Application,
  Boilerplate,
  init: (applicationConfig, boilerplateConfig) => {
    const application = new Application();
    const boilerplate = new Boilerplate(JSON.parse(applicationConfig), JSON.parse(boilerplateConfig));
    boilerplate.init().then(function (boilerplateResponse) {
      application.init(boilerplateResponse);
    });
  }
};
