/// <amd-dependency path="dojo/i18n!application/nls/resources.js" name="i18n" />
declare const i18n: any;

import requireUtils = require("esri/core/requireUtils");

import Boilerplate from 'boilerplate/Boilerplate';

import MapView = require("esri/views/MapView");
import SceneView = require("esri/views/SceneView");

import {
  getItemTitle,
  createWebMapFromItem,
  createWebSceneFromItem
} from "boilerplate/itemUtils";

import {
  setPageLocale,
  setPageDirection,
  setPageTitle,
  removePageLoading,
  addPageError
} from "boilerplate/domUtils";

import {
  getComponents,
  getCamera,
  getPoint,
  getExtent,
  getZoom,
  getBasemap,
  getGraphic,
  find
} from "boilerplate/urlUtils";

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
      addPageError(new Error("app:: Boilerplate is not defined"));
      return;
    }

    this.boilerplate = boilerplate;

    const { config, results, settings } = boilerplate;
    const webMapItem = results.webMapItem.value;
    const webSceneItem = results.webSceneItem.value;
    const groupItems = results.groupItems.value;
    const groupInfo = results.groupInfo.value;

    if (!webMapItem && !webSceneItem && !groupItems) {
      addPageError(new Error("app:: Could not load an item to display"));
      return;
    }

    setPageLocale(boilerplate.locale);
    setPageDirection(boilerplate.direction);


    // todo: support multiple webscenes, webmaps, groups.
    if (webMapItem) {
      config.title = getItemTitle(webMapItem) || config.title;
      this._createWebMap(webMapItem, config, settings).then((view) => {
        find(config.find, view);
        setPageTitle(config.title);
        removePageLoading();
      }).otherwise(addPageError);
    }
    else if (webSceneItem) {
      config.title = getItemTitle(webSceneItem) || config.title;
      this._createWebScene(webSceneItem, config, settings).then((view) => {
        find(config.find, view);
        setPageTitle(config.title);
        removePageLoading();
      }).otherwise(addPageError);
    }
    else if (groupItems) {
      const galleryHTML = this._createGroupGallery(groupInfo, groupItems);
      if (galleryHTML instanceof Error) {
        addPageError(galleryHTML);
      }
      else {
        document.body.innerHTML = galleryHTML;
        setPageTitle(config.title);
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

      const urlViewProperties = {
        camera: getCamera(config.camera),
        center: getPoint(config.center),
        zoom: getZoom(config.level),
        extent: getExtent(config.extent)
      };

      const uiComponents = getComponents(config.components);
      if (uiComponents) {
        // todo: fix in new typings
        // urlViewProperties.ui = {
        //   components: uiComponents
        // };
      }

      const basemap = getBasemap(config.basemapUrl, config.basemapReferenceUrl).then(basemap => {
        if (basemap) {
          map.basemap = basemap;
        }
      });


      const viewProperties = {
        map,
        container: settings.webmap.containerId,
        ...urlViewProperties
      };

      return requireUtils.when(require, "esri/views/MapView").then(MapView => {
        const mapView = new MapView(viewProperties);
        mapView.then(() => {
          const graphic = getGraphic(config.marker).then(graphic => {
            if (graphic) {
              mapView.graphics.add(graphic);
              mapView.goTo(graphic);
            }
          });
        });
        return mapView;
      });
    });
  }

  private _createWebScene(webSceneItem, config, settings): IPromise<SceneView> {
    return createWebSceneFromItem(webSceneItem).then(map => {
      const urlViewProperties = {
        ui: { components: getComponents(config.components) },
        camera: getCamera(config.camera),
        center: getPoint(config.center),
        zoom: getZoom(config.level),
        extent: getExtent(config.extent)
      };

      const basemap = getBasemap(config.basemapUrl, config.basemapReferenceUrl).then(basemap => {
        if (basemap) {
          map.basemap = basemap;
        }
      });

      const viewProperties = {
        map,
        container: settings.webscene.containerId,
        ...urlViewProperties
      };

      return requireUtils.when(require, "esri/views/SceneView").then(SceneView => {
        const sceneView = new SceneView(viewProperties);
        sceneView.then(() => {
          const graphic = getGraphic(config.marker).then(graphic => {
            if (graphic) {
              sceneView.graphics.add(graphic);
              sceneView.goTo(graphic);
            }
          });
        });
        return sceneView;
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
