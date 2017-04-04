/// <amd-dependency path="dojo/i18n!application/nls/resources.js" name="i18n" />
declare const i18n: any;
import requireUtils = require("esri/core/requireUtils");
import MapView = require("esri/views/MapView");
import SceneView = require("esri/views/SceneView");
import { BoilerplateResponse, BoilerplateSettings, GroupData, ApplicationConfig } from "boilerplate/interfaces";
import { createWebMapFromItem, createWebSceneFromItem } from "boilerplate/ItemHelper";
import { setConfigItemsOnView, getUrlViewProperties } from "boilerplate/UrlParamHelper";

const CSS = {
  loading: "boilerplate--loading",
  error: "boilerplate--error",
  errorIcon: "esri-icon-notice-round"
};

class Application {

  config: ApplicationConfig = null;
  settings: BoilerplateSettings = null;

  public init(boilerplateResponse: BoilerplateResponse): void {

    if (!boilerplateResponse) {
      this.reportError(new Error("app:: Boilerplate is not defined"));
      return;
    }

    this.config = boilerplateResponse.config;
    this.settings = boilerplateResponse.settings;

    const boilerplateResults = boilerplateResponse.results;
    const webMapItem = boilerplateResults.webMapItem;
    const webSceneItem = boilerplateResults.webSceneItem;
    const groupData = boilerplateResults.group;

    if (!webMapItem && !webSceneItem && !groupData) {
      this.reportError(new Error("app:: Could not load an item to display"));
      return;
    }

    this._setDocumentLocale(boilerplateResponse.locale);
    this._setDirection(boilerplateResponse.direction);

    // todo: support multiple webscenes, webmaps, groups.
    if (webMapItem) {
      this._createWebMap(webMapItem).then((view) => {
        setConfigItemsOnView(view, this.config);
        this._ready();
      }).otherwise(this.reportError);
    }
    else if (webSceneItem) {
      this._createWebScene(webSceneItem).then((view) => {
        setConfigItemsOnView(view, this.config);
        this._ready();
      }).otherwise(this.reportError);
    }
    else if (groupData) {
      const galleryHTML = this._createGroupGallery(groupData);
      if (galleryHTML instanceof Error) {
        this.reportError(galleryHTML);
      }
      else {
        document.body.innerHTML = galleryHTML;
        this._ready();
      }
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

  private _createWebMap(webMapItem): IPromise<MapView> {
    return createWebMapFromItem(webMapItem).then(map => {

      const urlViewProperties = getUrlViewProperties(this.config);

      const viewProperties = {
        map,
        container: this.settings.webmap.containerId,
        ...urlViewProperties
      };

      if (!this.config.title && map.portalItem && map.portalItem.title) {
        this.config.title = map.portalItem.title;
      }

      return requireUtils.when(require, "esri/views/MapView").then(MapView => {
        return new MapView(viewProperties);
      });
    });
  }

  private _createWebScene(webSceneItem): IPromise<SceneView> {
    return createWebSceneFromItem(webSceneItem).then(map => {
      const urlViewProperties = getUrlViewProperties(this.config);

      const viewProperties = {
        map,
        container: this.settings.webscene.containerId,
        ...urlViewProperties
      };

      if (!this.config.title && map.portalItem && map.portalItem.title) {
        this.config.title = map.portalItem.title;
      }

      return requireUtils.when(require, "esri/views/SceneView").then(SceneView => {
        return new SceneView(viewProperties);
      });
    });
  }

  private _createGroupGallery(groupData: GroupData): string | Error {
    const groupInfoData = groupData.infoData;
    const groupItemsData = groupData.itemsData;

    if (!groupInfoData || !groupItemsData || groupInfoData.total === 0 || groupInfoData instanceof Error) {
      return new Error("app:: group data does not exist.");
    }

    const info = groupInfoData.results[0];
    const items = groupItemsData.results;

    if (info && items) {
      const listItems = items.map((item: any) => {
        return `<li>${item.title}</li>`;
      });
      const listHTML = listItems.join("");

      const html = `<h1>${info.title}</h1><ol>${listHTML}</ol>`;
      return html;
    }
  }
}

export default Application;
