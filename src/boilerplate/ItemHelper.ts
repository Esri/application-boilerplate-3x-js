import promiseUtils = require("esri/core/promiseUtils");
import requireUtils = require("esri/core/requireUtils");
import WebMap = require("esri/WebMap");
import WebScene = require("esri/WebScene");
import { BoilerplateItem } from "boilerplate/interfaces";

export function createWebMapFromItem(item: BoilerplateItem): IPromise<WebMap> {
  if (!item) {
    return promiseUtils.reject(new Error("ItemHelper:: WebMap data does not exist."));
  }
  if (item.error) {
    return promiseUtils.reject(item.data);
  }

  const itemData = item.data;
  const itemJSON = item.json;

  if (!itemData && !itemJSON) {
    return promiseUtils.reject(new Error("ItemHelper:: WebMap does not have usable data."));
  }

  return requireUtils.when(require, "esri/WebMap").then(WebMap => {
    if (itemData) {
      const wm = new WebMap({
        portalItem: itemData
      });
      return wm.load();
    }
    // todo: fix
    // if (itemJSON) {
    //   const wm = WebMap.fromJSON(itemJSON.itemData);
    //   wm.portalItem = itemJSON.item;
    //   return wm.load();
    // }
  });
}

export function createWebSceneFromItem(item: BoilerplateItem): IPromise<WebScene> {
  if (!item) {
    return promiseUtils.reject(new Error("ItemHelper:: WebScene data does not exist."));
  }
  if (item.error) {
    return promiseUtils.reject(item.data);
  }

  const itemData = item.data;
  const itemJSON = item.json;

  if (!itemData && !itemJSON) {
    return promiseUtils.reject(new Error("ItemHelper:: WebScene does not have usable data."));
  }

  return requireUtils.when(require, "esri/WebScene").then(WebScene => {
    if (itemData) {
      const ws = new WebScene({
        portalItem: itemData
      });
      return ws.load();
    }
    if (itemJSON) {
      const ws = WebScene.fromJSON(itemJSON.itemData);
      ws.portalItem = itemJSON.item;
      return ws.load();
    }
  });
}

