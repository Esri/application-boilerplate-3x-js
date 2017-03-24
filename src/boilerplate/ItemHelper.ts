import promiseUtils = require('esri/core/promiseUtils');
import WebMap = require('esri/WebMap');
import WebScene = require('esri/WebScene');
import PortalItem = require('esri/portal/PortalItem');

interface Item {
  data?: PortalItem | Error;
  json?: {
    itemData: any,
    item: any
  }
}

class ItemHelper {

  public createWebMap(item: Item): IPromise<WebMap> {
    if (!item) {
      return promiseUtils.reject(new Error("ItemHelper:: WebMap data does not exist."));
    }
    if (item.data instanceof Error) {
      return promiseUtils.reject(item.data);
    }

    const wm = this._createWebMap(item);

    return wm ? promiseUtils.resolve(wm) : promiseUtils.reject(new Error("ItemHelper:: WebMap does not have usable data."));
  }

  public createWebScene(item: Item): IPromise<WebScene> {
    if (!item) {
      return promiseUtils.reject(new Error("ItemHelper:: WebScene data does not exist."));
    }
    if (item.data instanceof Error) {
      return promiseUtils.reject(item.data);
    }

    const ws = this._createWebScene(item);

    return ws ? promiseUtils.resolve(ws) : promiseUtils.reject(new Error("ItemHelper:: WebScene does not have usable data."));
  }

  private _createWebMap(item: Item): WebMap {
    if (item.data) {
      return new WebMap({
        portalItem: item.data
      });
    }
    // todo: fix
    // if (item.json) {
    //   const wm = WebMap.fromJSON(item.json.itemData);
    //   wm.portalItem = item.json.item;
    //   return wm;
    // }
  }

  private _createWebScene(item: Item): WebScene {
    if (item.data) {
      return new WebScene({
        portalItem: item.data
      });
    }

    if (item.json) {
      const ws = WebScene.fromJSON(item.json.itemData);
      ws.portalItem = item.json.item;
      return ws;
    }
  }

}

export default ItemHelper;
