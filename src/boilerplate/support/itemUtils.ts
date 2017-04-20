import requireUtils = require("esri/core/requireUtils");
import promiseUtils = require("esri/core/promiseUtils");
import watchUtils = require("esri/core/watchUtils");

import WebMap = require("esri/WebMap");
import WebScene = require("esri/WebScene");

import MapView = require("esri/views/MapView");
import SceneView = require("esri/views/SceneView");

import PortalItem = require("esri/portal/PortalItem");

import {
  ApplicationConfig
} from "../interfaces";

import {
  getBasemap,
  getCamera,
  getComponents,
  getExtent,
  getGraphic,
  getPoint,
  getZoom
} from "./urlUtils";

//--------------------------------------------------------------------------
//
//  Public Methods
//
//--------------------------------------------------------------------------

export function getViewProperties(config: ApplicationConfig): any {
  const { center, components, extent, level, viewpoint } = config;
  const ui = components ? { ui: { components: getComponents(components) } } : null;
  const cameraProps = viewpoint ? { camera: getCamera(viewpoint) } : null;
  const centerProps = center ? { center: getPoint(center) } : null;
  const zoomProps = level ? { zoom: getZoom(level) } : null;
  const extentProps = extent ? { extent: getExtent(extent) } : null;

  const urlViewProperties = {
    ...ui,
    ...cameraProps,
    ...centerProps,
    ...zoomProps,
    ...extentProps
  };

  return {
    ...urlViewProperties
  };
}

export function createMap(item: PortalItem): IPromise<WebMap | WebScene> {
  const isWebMap = item.type === "Web Map";
  const isWebScene = item.type === "Web Scene";

  if (!isWebMap && !isWebScene) {
    return promiseUtils.reject();
  }

  return isWebMap ? createWebMapFromItem(item) : createWebSceneFromItem(item) as IPromise<WebMap | WebScene>;;
}

export function createView(map: WebMap | WebScene, viewProperties: any): IPromise<MapView | SceneView> {
  const isWebMap = map.declaredClass === "esri.WebMap";
  const isWebScene = map.declaredClass === "esri.WebScene";

  if (!isWebMap && !isWebScene) {
    return promiseUtils.reject();
  }

  const viewTypePath = isWebMap ? "esri/views/MapView" : "esri/views/SceneView";

  viewProperties.map = map;

  return requireUtils.when(require, viewTypePath).then(ViewType => {
    return new ViewType(viewProperties);
  });
}

export function createWebMapFromItem(portalItem: PortalItem): IPromise<WebMap> {
  return requireUtils.when(require, "esri/WebMap").then(WebMap => {
    const wm = new WebMap({
      portalItem: portalItem
    });
    return wm.load();
  });
}

export function createWebSceneFromItem(portalItem: PortalItem): IPromise<WebScene> {
  return requireUtils.when(require, "esri/WebScene").then(WebScene => {
    const ws = new WebScene({
      portalItem: portalItem
    });
    return ws.load();
  });
}

export function getItemTitle(item: PortalItem): string {
  if (item && item.title) {
    return item.title;
  }
}

export function setBasemap(map: WebMap | WebScene, config: ApplicationConfig): IPromise<WebMap | WebScene> {
  const { basemapUrl, basemapReferenceUrl } = config;

  if (!basemapUrl || !map) {
    return promiseUtils.resolve(map);
  }

  return getBasemap(basemapUrl, basemapReferenceUrl).then(basemap => {
    map.basemap = basemap;
    return map;
  });
}

export function setGraphic(marker: string, view: MapView | SceneView): IPromise<any> {
  if (!marker || !view) {
    return promiseUtils.resolve();
  }

  return getGraphic(marker).then(graphic => {
    view.graphics.add(graphic);
    const view2 = view as any; // todo: Typings will be fixed in next release.
    return view2.goTo(graphic);
  });
}

export function setFindLocation(query: string, view: MapView | SceneView): IPromise<any> {
  // ?find=redlands, ca
  if (!query || !view) {
    return promiseUtils.resolve();
  }

  return requireUtils.when(require, "esri/widgets/Search/SearchViewModel").then(SearchViewModel => {
    const searchVM = new SearchViewModel({
      view: view
    });
    return searchVM.search(query).then(result => {
      watchUtils.whenFalseOnce(view, "popup.visible", () => searchVM.destroy());
      return result;
    });
  });
}
