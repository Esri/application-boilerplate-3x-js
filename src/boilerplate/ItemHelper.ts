import requireUtils = require("esri/core/requireUtils");
import WebMap = require("esri/WebMap");
import WebScene = require("esri/WebScene");
import PortalItem = require("esri/portal/PortalItem");

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
