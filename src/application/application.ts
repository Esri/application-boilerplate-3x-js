/// <amd-dependency path="dojo/i18n!application/nls/resources.js" name="i18n" />
declare const i18n: any;

import requireUtils = require("esri/core/requireUtils");

import Boilerplate from 'boilerplate/Boilerplate';

import MapView = require("esri/views/MapView");
import SceneView = require("esri/views/SceneView");

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

    setPageLocale(boilerplate.locale);
    setPageDirection(boilerplate.direction);

    if (!config.title) {
      config.title = getItemTitle(webSceneItem || webMapItem || groupInfoItem);
    }

    setPageTitle(config.title);

    // todo: support multiple webscenes, webmaps, groups.
    if (webMapItem) {
      this._createWebMap(webMapItem, config, settings).then(view => {
        if (config.find) {
          find(config.find, view);
        }
        removePageLoading();
      }).otherwise(error => {
        addPageError(i18n.error, error.message);
      });
    }
    else if (webSceneItem) {
      this._createWebScene(webSceneItem, config, settings).then(view => {
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

  private _createWebMap(webMapItem, config, settings): IPromise<MapView> {
    return createWebMapFromItem(webMapItem).then(map => {
      const ui = config.components ? { components: getComponents(config.components) } : {};

      const urlViewProperties = {
        ui,
        camera: getCamera(config.camera),
        center: getPoint(config.center),
        zoom: getZoom(config.level),
        extent: getExtent(config.extent)
      };

      const { basemapUrl, basemapReferenceUrl, marker } = config;
      if (basemapUrl) {
        getBasemap(basemapUrl, basemapReferenceUrl).then(basemap => {
          map.basemap = basemap;
        });
      }

      const viewProperties = {
        map,
        container: settings.webmap.containerId,
        ...urlViewProperties
      };

      return requireUtils.when(require, "esri/views/MapView").then(MapView => {
        const mapView = new MapView(viewProperties);
        mapView.then(() => {
          if (marker) {
            getGraphic(marker).then(graphic => {
              mapView.graphics.add(graphic);
              mapView.goTo(graphic);
            });
          }
        });
        return mapView;
      });
    });
  }

  private _createWebScene(webSceneItem, config, settings): IPromise<SceneView> {
    return createWebSceneFromItem(webSceneItem).then(map => {
      const ui = config.components ? { components: getComponents(config.components) } : {};

      const urlViewProperties = {
        ui,
        camera: getCamera(config.camera),
        center: getPoint(config.center),
        zoom: getZoom(config.level),
        extent: getExtent(config.extent),
      };

      const { basemapUrl, basemapReferenceUrl, marker } = config;
      if (basemapUrl) {
        getBasemap(basemapUrl, basemapReferenceUrl).then(basemap => {
          map.basemap = basemap;
        });
      }

      const viewProperties = {
        map,
        container: settings.webscene.containerId,
        ...urlViewProperties
      };

      return requireUtils.when(require, "esri/views/SceneView").then(SceneView => {
        const sceneView = new SceneView(viewProperties);
        sceneView.then(() => {
          if (marker) {
            getGraphic(marker).then(graphic => {
              sceneView.graphics.add(graphic);
              sceneView.goTo(graphic);
            });
          }
        });
        return sceneView;
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
