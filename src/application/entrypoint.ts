import Application from 'application/Application';
import Boilerplate from 'boilerplate/Boilerplate';

// todo: should this be a class?
export = {
  Application,
  Boilerplate,
  init: (applicationConfigJSON, boilerplateConfigJSON) => {
    const application = new Application();
    const boilerplate = new Boilerplate(JSON.parse(applicationConfigJSON), JSON.parse(boilerplateConfigJSON));
    boilerplate.load().then(response => application.init(response));
  }
};
