/// <amd-dependency path="dojo/i18n!application/nls/resources.js" name="i18n" />
declare const i18n: any;

import requireUtils = require("esri/core/requireUtils");

import Boilerplate from 'boilerplate/Boilerplate';

import MapView = require("esri/views/MapView");
import SceneView = require("esri/views/SceneView");

import {
  createWebMapFromItem,
  createWebSceneFromItem
} from "boilerplate/itemUtils";

import {
  setConfigItemsOnView,
  getUrlViewProperties
} from "boilerplate/urlUtils";

const CSS = {
  loading: "boilerplate--loading",
  error: "boilerplate--error",
  errorIcon: "esri-icon-notice-round"
};

// todo: should this be a class?
class Application {

  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------

  boilerplate: Boilerplate = null;

  //--------------------------------------------------------------------------
  //
  //  Public Methods
  //
  //--------------------------------------------------------------------------

  public init(boilerplate: Boilerplate): void {

    if (!boilerplate) {
      this.reportError(new Error("app:: Boilerplate is not defined"));
      return;
    }

    this.boilerplate = boilerplate;

    // todo
    const boilerplateResults = boilerplate.results;
    const webMapItem = boilerplateResults.webMapItem.value;
    const webSceneItem = boilerplateResults.webSceneItem.value;
    const groupItems = boilerplateResults.groupItems.value;
    const groupInfo = boilerplateResults.groupInfo.value;

    if (!webMapItem && !webSceneItem && !groupItems) {
      this.reportError(new Error("app:: Could not load an item to display"));
      return;
    }

    this._setDocumentLocale(boilerplate.locale);
    this._setDirection(boilerplate.direction);

    const config = this.boilerplate.config;
    const settings = this.boilerplate.settings;

    // todo
    if (!config.title && webMapItem && webMapItem.title) {
      config.title = webMapItem.title;
    }

    if (!config.title && webSceneItem && webSceneItem.title) {
      config.title = webSceneItem.title;
    }


    // todo: support multiple webscenes, webmaps, groups.
    if (webMapItem) {
      this._createWebMap(webMapItem, config, settings).then((view) => {
        setConfigItemsOnView(view, config);
        this._setTitle(config.title);
        this._removeLoading();
      }).otherwise(this.reportError);
    }
    else if (webSceneItem) {
      this._createWebScene(webSceneItem, config, settings).then((view) => {
        setConfigItemsOnView(view, config);
        this._setTitle(config.title);
        this._removeLoading();
      }).otherwise(this.reportError);
    }
    else if (groupItems) {
      const galleryHTML = this._createGroupGallery(groupInfo, groupItems);
      if (galleryHTML instanceof Error) {
        this.reportError(galleryHTML);
      }
      else {
        document.body.innerHTML = galleryHTML;
        this._setTitle(config.title);
        this._removeLoading();
      }
    }
  }

  public reportError(error) {
    this._removeLoading();
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

  //--------------------------------------------------------------------------
  //
  //  Private Methods
  //
  //--------------------------------------------------------------------------

  private _setDocumentLocale(locale: string): void {
    document.documentElement.lang = locale;
  }

  private _setDirection(direction: string) {
    const dirNode = document.getElementsByTagName("html")[0];
    dirNode.setAttribute("dir", direction);
  }

  private _setTitle(title: string) {
    document.title = title;
  }

  private _removeLoading() {
    document.body.className = document.body.className.replace(CSS.loading, "");
  }

  private _createWebMap(webMapItem, config, settings): IPromise<MapView> {
    return createWebMapFromItem(webMapItem).then(map => {

      const urlViewProperties = getUrlViewProperties(config);

      const viewProperties = {
        map,
        container: settings.webmap.containerId,
        ...urlViewProperties
      };

      return requireUtils.when(require, "esri/views/MapView").then(MapView => {
        return new MapView(viewProperties);
      });
    });
  }

  private _createWebScene(webSceneItem, config, settings): IPromise<SceneView> {
    return createWebSceneFromItem(webSceneItem).then(map => {
      const urlViewProperties = getUrlViewProperties(config);

      const viewProperties = {
        map,
        container: settings.webscene.containerId,
        ...urlViewProperties
      };

      return requireUtils.when(require, "esri/views/SceneView").then(SceneView => {
        return new SceneView(viewProperties);
      });
    });
  }

  private _createGroupGallery(groupInfo: any, groupItems: any): string | Error {
    if (!groupInfo || !groupItems || groupInfo.total === 0 || groupInfo instanceof Error) {
      return new Error("app:: group data does not exist.");
    }

    const info = groupItems.results[0];
    const items = groupItems.results;

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
