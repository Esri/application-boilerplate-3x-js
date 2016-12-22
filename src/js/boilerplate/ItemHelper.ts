/*
 | Copyright 2016 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */

import Deferred = require("dojo/Deferred");
import WebScene = require("esri/WebScene");
import WebMap = require("esri/WebMap");

import BoilerplateItem = require("./BoilerplateItem");

class ItemHelper {

  //--------------------------------------------------------------------------
  //
  //  Public Methods
  //
  //--------------------------------------------------------------------------

  public createWebMap(item: BoilerplateItem) {
    const deferred = new Deferred();
    if (!item) {
      deferred.reject(new Error("ItemHelper:: WebMap data does not exist."));
    }
    else if (item.data instanceof Error) {
      deferred.reject(item.data);
    }
    else {
      let wm: WebMap | null = null;
      if (item.data) {
        wm = new WebMap({
          portalItem: item.data
        });
      }
      else if (item.json) {
        wm = WebMap.fromJSON(item.json.itemData);
        wm.portalItem = item.json.item;
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

  public createWebScene(item: BoilerplateItem) {
    const deferred = new Deferred();
    if (!item) {
      deferred.reject(new Error("ItemHelper:: WebScene data does not exist."));
    }
    else if (item.data instanceof Error) {
      deferred.reject(item.data);
    }
    else {
      let ws: WebScene | null = null;
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

export = ItemHelper;
