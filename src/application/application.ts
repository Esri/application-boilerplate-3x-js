/// <amd-dependency path="dojo/i18n!application/nls/resources.js" name="i18n" />
declare const i18n: any;

import requireUtils = require("esri/core/requireUtils");
import promiseUtils = require("esri/core/promiseUtils");

import Boilerplate from 'boilerplate/Boilerplate';

import MapView = require("esri/views/MapView");
import SceneView = require("esri/views/SceneView");

import WebMap = require("esri/WebMap");
import WebScene = require("esri/WebScene");

import PortalItem = require("esri/portal/PortalItem");

import {
  getItemTitle,
  createWebMapFromItem,
  createWebSceneFromItem
} from "boilerplate/support/itemUtils";

import {
  getViewProperties,
  getBasemap,
  getGraphic,
  find
} from "boilerplate/support/urlUtils";

import {
  setPageLocale,
  setPageDirection,
  setPageTitle,
  removePageLoading,
  addPageError
} from "boilerplate/support/domHelper";

import {
  ApplicationConfig,
  BoilerplateSettings
} from "boilerplate/interfaces";

class Application {

  // todo: make this simplfied with options.
  // todo: use sass
  // todo: setup grunt watcher?
  // todo: documentation
  // todo: have JC review?

  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------

  //----------------------------------
  //  boilerplate
  //----------------------------------
  boilerplate: Boilerplate = null;

  //--------------------------------------------------------------------------
  //
  //  Public Methods
  //
  //--------------------------------------------------------------------------

  public init(boilerplate: Boilerplate): void {

    if (!boilerplate) {
      addPageError({
        title: i18n.error,
        message: "Boilerplate is not defined"
      });
      return;
    }

    setPageLocale(boilerplate.locale);
    setPageDirection(boilerplate.direction);

    this.boilerplate = boilerplate;

    const { config, results, settings } = boilerplate;
    const { webMapItems, webSceneItems } = results;

    const validWebMaps = webMapItems.map(response => {
      return response.value;
    });

    const validWebScenes = webSceneItems.map(response => {
      return response.value;
    });

    const firstItem = validWebMaps[0] || validWebScenes[0];

    if (!firstItem) {
      addPageError({
        title: i18n.error,
        message: "Could not load an item to display"
      });
      return;
    }

    removePageLoading();

    config.title = !config.title ? getItemTitle(firstItem) : "";
    setPageTitle(config.title);

    const viewContainerNode = document.getElementById("viewContainer");

    const viewNodes = [];

    validWebMaps.forEach(webmap => {
      const viewNode = document.createElement("div");
      viewNodes.push(viewNode);
      this._createView(webmap, config, viewNode);
    });

    validWebScenes.forEach(webscene => {
      const viewNode = document.createElement("div");
      viewNodes.push(viewNode);
      this._createView(webscene, config, viewNode);
    });

    viewNodes.forEach(viewNode => {
      viewContainerNode.appendChild(viewNode);
    });

  }

  //--------------------------------------------------------------------------
  //
  //  Private Methods
  //
  //--------------------------------------------------------------------------

  private _setBasemap(config: ApplicationConfig, map: WebMap | WebScene): void {
    const { basemapUrl, basemapReferenceUrl } = config;

    if (!basemapUrl) {
      return;
    }

    getBasemap(basemapUrl, basemapReferenceUrl).then(basemap => {
      map.basemap = basemap;
    });
  }

  private _addMarker(config: ApplicationConfig, view: MapView | SceneView): void {
    const { marker } = config;

    if (!marker) {
      return;
    }

    getGraphic(marker).then(graphic => {
      view.graphics.add(graphic);
      if (view instanceof MapView) { // todo: Typings will be fixed in next release.
        view.goTo(graphic);
      }
      else {
        view.goTo(graphic);
      }
    });
  }

  private _createView(item: PortalItem, config: ApplicationConfig, node: HTMLElement): IPromise<MapView | SceneView> {
    const isWebMap = item.type === "Web Map";
    const isWebScene = item.type === "Web Scene";

    if (!isWebMap && !isWebScene) {
      return promiseUtils.reject();
    }

    const createItem = isWebMap ? createWebMapFromItem(item) : createWebSceneFromItem(item) as IPromise<WebMap | WebScene>;
    const viewTypePath = isWebMap ? "esri/views/MapView" : "esri/views/SceneView";

    return createItem.then((map) => {
      this._setBasemap(config, map);

      const viewProperties = getViewProperties(config);
      viewProperties.container = node;
      viewProperties.map = map;

      return requireUtils.when(require, viewTypePath).then(ViewType => {
        const view = new ViewType(viewProperties);
        view.then(() => {
          this._addMarker(config, view);

          if (config.find) {
            find(config.find, view);
          }

        });
        return view;
      });
    });
  }

}

export default Application;
