import promiseUtils = require("esri/core/promiseUtils");
import requireUtils = require("esri/core/requireUtils");
import WebMap = require("esri/WebMap");
import WebScene = require("esri/WebScene");
import PortalItem = require("esri/portal/PortalItem");

interface BoilerplateItem {
  data?: PortalItem | Error;
  json?: {
    itemData: any,
    item: any
  }
}

export function createWebMap(item: BoilerplateItem): IPromise<WebMap> {
  if (!item) {
    return promiseUtils.reject(new Error("ItemHelper:: WebMap data does not exist."));
  }
  if (item.data instanceof Error) {
    return promiseUtils.reject(item.data);
  }

  const itemData = item.data;
  const itemJSON = item.json;

  if (!itemData && !itemJSON) {
    return promiseUtils.reject(new Error("ItemHelper:: WebMap does not have usable data."));
  }

  return requireUtils.when(require, "esri/WebMap").then(WebMap => {
    if (itemData) {
      return new WebMap({
        portalItem: itemData
      });
    }
    // todo: fix
    // if (itemJSON) {
    //   const wm = WebMap.fromJSON(itemJSON.itemData);
    //   wm.portalItem = itemJSON.item;
    //   return wm;
    // }
  });
}

export function createWebScene(item: BoilerplateItem): IPromise<WebScene> {
  if (!item) {
    return promiseUtils.reject(new Error("ItemHelper:: WebScene data does not exist."));
  }
  if (item.data instanceof Error) {
    return promiseUtils.reject(item.data);
  }

  const itemData = item.data;
  const itemJSON = item.json;

  if (!itemData && !itemJSON) {
    return promiseUtils.reject(new Error("ItemHelper:: WebScene does not have usable data."));
  }

  return requireUtils.when(require, "esri/WebScene").then(WebScene => {
    if (itemData) {
      return new WebScene({
        portalItem: itemData
      });
    }
    if (itemJSON) {
      const wm = WebScene.fromJSON(itemJSON.itemData);
      wm.portalItem = itemJSON.item;
      return wm;
    }
  });
}

