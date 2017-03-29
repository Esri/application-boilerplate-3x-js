/// <amd-dependency path="dojo/i18n!application/nls/resources.js" name="i18n" />
declare const i18n: any;
import MapView = require("esri/views/MapView"); // todo: lazy load
import SceneView = require("esri/views/SceneView"); // todo: lazy load
import { BoilerplateResponse, Settings, GroupData, Config } from "boilerplate/interfaces";
import { createWebMap, createWebScene } from "boilerplate/ItemHelper";
import { setConfigItemsOnView, getUrlViewProperties } from "boilerplate/UrlParamHelper";

const CSS = {
  loading: "boilerplate--loading",
  error: "boilerplate--error",
  errorIcon: "esri-icon-notice-round"
};

class Application {

  config: Config = null;
  direction: any = null;
  settings: Settings = null;

  public init(boilerplateResponse: BoilerplateResponse): void {

    if (!boilerplateResponse) {
      this.reportError(new Error("app:: Boilerplate is not defined"));
    }

    this.direction = boilerplateResponse.direction;
    this.config = boilerplateResponse.config;
    this.settings = boilerplateResponse.settings;

    const boilerplateResults = boilerplateResponse.results;
    const webMapItem = boilerplateResults.webMapItem;
    const webSceneItem = boilerplateResults.webSceneItem;
    const groupData = boilerplateResults.group;

    this._setDocumentLocale(boilerplateResponse.locale);
    this._setDirection(boilerplateResponse.direction);

    // todo: support multiple webscenes, webmaps, groups.
    // todo: allow all at once
    if (webMapItem) {
      this._createWebMap(webMapItem);
    }
    else if (webSceneItem) {
      this._createWebScene(webSceneItem);
    }
    else if (groupData) {
      this._createGroupGallery(groupData);
    }

    if (!webMapItem && !webSceneItem && !groupData) {
      this.reportError(new Error("app:: Could not load an item to display"));
    }
  }

  public reportError(error) {
    // remove loading class from body
    document.body.removeAttribute('class');
    document.body.className = CSS.error;
    // an error occurred - notify the user. In this example we pull the string from the
    // resource.js file located in the nls folder because we've set the application up
    // for localization. If you don't need to support multiple languages you can hardcode the
    // strings here and comment out the call in index.html to get the localization strings.
    // set message
    const node = document.getElementById("loading_message");
    if (node) {
      node.innerHTML = "<h1><span class=\"" + CSS.errorIcon + "\"></span> " + i18n.error + "</h1><p>" + error.message + "</p>";
    }
    return error;
  }

  private _setDocumentLocale(locale: string): void {
    document.documentElement.lang = locale;
  }

  private _setDirection(direction: string) {
    const dirNode = document.getElementsByTagName("html")[0];
    dirNode.setAttribute("dir", direction);
  }

  private _ready() {
    document.body.removeAttribute('class');
    document.title = this.config.title;
  }

  private _createWebMap(webMapItem) {
    createWebMap(webMapItem).then(map => {

      const urlViewProperties = getUrlViewProperties(this.config) as any; // todo: fix interface

      const viewProperties = {
        map,
        container: this.settings.webmap.containerId,
        ...urlViewProperties
      };

      if (!this.config.title && map.portalItem && map.portalItem.title) {
        this.config.title = map.portalItem.title;
      }

      const view = new MapView(viewProperties);

      view.then(() => {
        setConfigItemsOnView(view, this.config);
        this._ready();
      }, this.reportError);

    }, this.reportError);
  }

  private _createWebScene(webSceneItem) {
    createWebScene(webSceneItem).then(map => {
      console.log(map);
      // todo: not getting in here

      const urlViewProperties = getUrlViewProperties(this.config) as any; // todo: fix interface

      const viewProperties = {
        map,
        container: this.settings.webscene.containerId,
        ...urlViewProperties
      };

      if (!this.config.title && map.portalItem && map.portalItem.title) {
        this.config.title = map.portalItem.title;
      }

      const view = new SceneView(viewProperties);

      view.then(() => {
        setConfigItemsOnView(view, this.config);
        this._ready();
      }, this.reportError);

    }, this.reportError);
  }

  private _createGroupGallery(groupData: GroupData) {
    const groupInfoData = groupData.infoData;
    const groupItemsData = groupData.itemsData;

    if (!groupInfoData || !groupItemsData || groupInfoData.total === 0 || groupInfoData instanceof Error) {
      this.reportError(new Error("app:: group data does not exist."));
      return;
    }

    const info = groupInfoData.results[0];
    const items = groupItemsData.results;

    this._ready();

    if (info && items) {

      const listNodes = items.map((item: any) => {
        return `<li>${item.title}</li>`;
      });

      const html = `
        <h1>${info.title}</h1>
        <ol>
        ${listNodes}
        </ol>
      `;

      // let html = "";

      // html += "<h1>" + info.title + "</h1>";

      // html += "<ol>";

      // items.forEach((item) => {
      //   html += "<li>" + item.title + "</li>";
      // });

      // html += "</ol>";

      document.body.innerHTML = html;
    }
  }
}

export default Application;
