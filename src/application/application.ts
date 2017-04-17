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
} from "application/itemHelper";

import {
  setPageLocale,
  setPageDirection,
  setPageTitle,
  removePageLoading,
  addPageError
} from "application/domHelper";

import {
  getComponents,
  getCamera,
  getPoint,
  getExtent,
  getZoom,
  getBasemap,
  getGraphic,
  find
} from "application/urlHelper";

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

    this.boilerplate = boilerplate;

    const { config, results, settings } = boilerplate;
    const webMapItem = results.webMapItem.value;
    const webSceneItem = results.webSceneItem.value;
    const groupItemsValue = results.groupItems.value;
    const groupInfoValue = results.groupInfo.value;
    const groupItems = groupItemsValue && groupItemsValue.results;
    const groupInfoItem = groupInfoValue && groupInfoValue.results && groupInfoValue.results[0];

    if (!webMapItem && !webSceneItem && !groupInfoItem) {
      addPageError(i18n.error, "app:: Could not load an item to display");
      return;
    }

    if (!config.title) {
      config.title = getItemTitle(webSceneItem || webMapItem || groupInfoItem);
    }

    setPageLocale(boilerplate.locale);
    setPageDirection(boilerplate.direction);
    setPageTitle(config.title);

    // todo: support multiple webscenes, webmaps, groups.
    if (webMapItem) {
      this._createView(webMapItem, config, settings).then(view => {
        if (config.find) {
          find(config.find, view);
        }
        removePageLoading();
      }).otherwise(error => {
        addPageError(i18n.error, error.message);
      });
    }
    else if (webSceneItem) {
      this._createView(webSceneItem, config, settings).then(view => {
        if (config.find) {
          find(config.find, view);
        }
        removePageLoading();
      }).otherwise(error => {
        addPageError(i18n.error, error.message);
      });
    }
    else if (groupItems) {
      const galleryHTML = this._createGroupGallery(groupInfoItem, groupItems);
      if (!galleryHTML) {
        addPageError(i18n.error, "app:: group data does not exist.");
      }
      else {
        document.body.innerHTML = galleryHTML;
        removePageLoading();
      }
    }



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

  private _getViewProperties(config: ApplicationConfig, containerId: string, map: WebMap | WebScene) {
    const { camera, center, components, extent, level } = config;
    const ui = components ? { components: getComponents(components) } : {};

    const urlViewProperties = {
      ui,
      camera: getCamera(camera),
      center: getPoint(center),
      zoom: getZoom(level),
      extent: getExtent(extent)
    };

    return {
      map,
      container: containerId,
      ...urlViewProperties
    };
  }

  private _createView(item: PortalItem, config: ApplicationConfig, settings: BoilerplateSettings): IPromise<MapView | SceneView> {
    const isWebMap = item.type === "Web Map";
    const isWebScene = item.type === "Web Scene";

    if (!isWebMap && !isWebScene) {
      return promiseUtils.reject();
    }

    const createItem = isWebMap ? createWebMapFromItem(item) : createWebSceneFromItem(item) as IPromise<WebMap | WebScene>;
    const containerId = isWebMap ? settings.webmap.containerId : settings.webscene.containerId;
    const viewTypePath = isWebMap ? "esri/views/MapView" : "esri/views/SceneView";

    return createItem.then((map) => {
      this._setBasemap(config, map);

      const viewProperties = this._getViewProperties(config, containerId, map);

      return requireUtils.when(require, viewTypePath).then(ViewType => {
        const view = new ViewType(viewProperties);
        view.then(() => {
          this._addMarker(config, view);
        });
        return view;
      });
    });
  }

  private _createGroupGallery(groupInfoItem: PortalItem, groupItems: PortalItem[]): string {
    if (!groupInfoItem || !groupItems) {
      return;
    }

    const listItems = groupItems.map(item => {
      return `<li>${item.title}</li>`;
    });

    const listHTML = listItems.join("");

    return `<h1>${groupInfoItem.title}</h1><ol>${listHTML}</ol>`;
  }
}

export default Application;
