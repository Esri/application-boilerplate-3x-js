import Deferred = require("dojo/Deferred");
import WebScene = require("esri/WebScene");
import WebMap = require("esri/WebMap");
import PortalItem = require("esri/portal/PortalItem");


interface BoilerplateItem {
  json: any;
  data: any;
}
class ItemHelper {

  // --------------------------------------------------------------------------
  //
  //  Public Methods
  //
  // --------------------------------------------------------------------------

  public createWebMap(item: BoilerplateItem) {
    const deferred = new Deferred();
    if (!item) {
      deferred.reject(new Error("ItemHelper:: WebMap data does not exist."));
    } else if (item.data instanceof Error) {
      deferred.reject(item.data);
    } else {
      let wm: WebMap | null = null;
      if (item.data) {
        wm = new WebMap({ portalItem: item.data });
      } else if (item.json) {
        wm = new WebMap({
          portalItem: PortalItem.fromJSON(item.json.item)
        });
      }
      if (!wm) {
        deferred.reject(new Error("ItemHelper:: WebMap does not have usable data."));
      } else {
        deferred.resolve(wm);
      }
    }
    return deferred.promise;
  }

  public createWebScene(item: BoilerplateItem) {
    const deferred = new Deferred();
    if (!item) {
      deferred.reject(new Error("ItemHelper:: WebScene data does not exist."));
    } else if (item.data instanceof Error) {
      deferred.reject(item.data);
    } else {
      let ws: WebScene | null = null;
      if (item.data) {
        ws = new WebScene({ portalItem: item.data });
      } else if (item.json) {
        ws = WebScene.fromJSON(item.json.itemData);
        ws.portalItem = item.json.item;
      }
      if (!ws) {
        deferred.reject(new Error("ItemHelper:: WebScene does not have usable data."));
      } else {
        deferred.resolve(ws);
      }
    }
    return deferred.promise;
  }

}

export = ItemHelper;
