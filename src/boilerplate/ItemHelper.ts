import Deferred = require('dojo/Deferred'); // todo: replace with es6 promise
import DojoPromise = require('dojo/promise/Promise'); // todo: replace with es6 promise
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


// todo: try to remove Dojo/deferred and promise.

class ItemHelper {
  public createWebMap(item: Item): DojoPromise<WebMap> {
    const deferred = new Deferred();
    if (!item) {
      deferred.reject(new Error("ItemHelper:: WebMap data does not exist."));
    }
    else if (item.data instanceof Error) {
      deferred.reject(item.data);
    }
    else {
      let wm;
      if (item.data) {
        wm = new WebMap({
          portalItem: item.data
        });
      }
      if (!wm) {
        deferred.reject(new Error("ItemHelper:: WebMap does not have usable data."));
      }
      else {
        deferred.resolve(wm);
      }
    }
    return deferred.promise;
  }

  public createWebScene(item: Item): DojoPromise<WebScene> {
    const deferred = new Deferred();
    if (!item) {
      deferred.reject(new Error("ItemHelper:: WebScene data does not exist."));
    }
    else if (item.data instanceof Error) {
      deferred.reject(item.data);
    }
    else {
      let ws;
      if (item.data) {
        ws = new WebScene({
          portalItem: item.data
        });
      }
      else if (item.json) {
        ws = WebScene.fromJSON(item.json.itemData);
        ws.portalItem = item.json.item;
      }
      if (!ws) {
        deferred.reject(new Error("ItemHelper:: WebScene does not have usable data."));
      }
      else {
        deferred.resolve(ws);
      }
    }
    return deferred.promise;
  }
}

export default ItemHelper;
