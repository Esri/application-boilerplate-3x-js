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
} from "application/domHelper";

import {
  ApplicationConfig,
  BoilerplateSettings
} from "boilerplate/interfaces";

class Application {

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
      addPageError(i18n.error, "app:: Boilerplate is not defined");
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
      addPageError(i18n.error, "app:: Could not load an item to display");
      return;
    }

    if (!config.title) {
      config.title = getItemTitle(firstItem);
    }
    setPageTitle(config.title);

    const viewContainerNode = document.getElementById("viewContainer");

    validWebMaps.forEach(webmap => {
      const viewNode = document.createElement("div");
      viewContainerNode.appendChild(viewNode);
      this._setupItem(webmap, config, viewNode);
    });

    validWebScenes.forEach(webscene => {
      const viewNode = document.createElement("div");
      viewContainerNode.appendChild(viewNode);
      this._setupItem(webscene, config, viewNode);
    });

  }

  //--------------------------------------------------------------------------
  //
  //  Private Methods
  //
  //--------------------------------------------------------------------------

  private _setBasemap(config: ApplicationConfig, map: WebMap | WebScene): void {
    const { basemapUrl, basemapReferenceUrl } = config;
    if (basemapUrl) {
      getBasemap(basemapUrl, basemapReferenceUrl).then(basemap => {
        map.basemap = basemap;
      });
    }
  }

  private _addMarker(config: ApplicationConfig, view: MapView | SceneView): void {
    const { marker } = config;
    if (marker) {
      getGraphic(marker).then(graphic => {
        view.graphics.add(graphic);
        if (view instanceof MapView) { // todo: will fix in next API release.
          view.goTo(graphic);
        }
        else {
          view.goTo(graphic);
        }
      });
    }
  }

  private _setupItem(item: PortalItem, config: ApplicationConfig, node: HTMLElement) {
    this._createView(item, config, node).then(view => {
      if (config.find) {
        find(config.find, view);
      }
      removePageLoading();
    }).otherwise(error => {
      addPageError(i18n.error, error.message);
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
        });
        return view;
      });
    });
  }


}

export default Application;
