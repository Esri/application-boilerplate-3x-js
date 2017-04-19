import Application from 'application/Application';
import Boilerplate from 'boilerplate/Boilerplate';

export function init(applicationConfigJSON: string, boilerplateConfigJSON: string): void {
  const application = new Application();
  const boilerplate = new Boilerplate(JSON.parse(applicationConfigJSON), JSON.parse(boilerplateConfigJSON));
  boilerplate.load().then(response => application.init(response));
}
