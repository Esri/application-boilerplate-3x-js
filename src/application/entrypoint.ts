import Application from 'application/application';
import Boilerplate from 'boilerplate/boilerplate';

export = {
  Application,
  Boilerplate,
  init: (configSettings, boilerplateSettings) => {
    const application = new Application();
    const boilerplate = new Boilerplate(JSON.parse(configSettings), JSON.parse(boilerplateSettings));
    boilerplate.init().then(function (boilerplateResponse) {
      application.init(boilerplateResponse);
    });
  }
};
