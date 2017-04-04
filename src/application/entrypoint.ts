import Application from 'application/application';
import Boilerplate from 'boilerplate/boilerplate';

export = {
  Application,
  Boilerplate,
  init: (applicationConfigJSON, boilerplateConfigJSON) => {
    const application = new Application();
    const boilerplate = new Boilerplate(JSON.parse(applicationConfigJSON), JSON.parse(boilerplateConfigJSON));
    boilerplate.init().then(response => application.init(response));
  }
};
