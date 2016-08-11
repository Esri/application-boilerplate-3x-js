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
define([
  "dojo/_base/declare",
  "dojo/Deferred"
], function (declare, Deferred) {

  return declare(null, {

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    createWebMap: function (item) {
      var deferred = new Deferred();
      if(!item) {
        deferred.reject(new Error("ItemHelper:: WebMap data does not exist."));
      }
      else if(item.data instanceof Error) {
        deferred.reject(item.data);
      }
      else {
        require(["esri/WebMap"], function (WebMap) {
          var wm;
          if(item.data) {
            wm = new WebMap({
              portalItem: item.data
            });
          }
          else if(item.json) {
            wm = WebMap.fromJSON(item.json.itemData);
            wm.portalItem = item.json.item;
          }
          if(!wm) {
            deferred.reject(new Error("ItemHelper:: WebMap does not have usable data."));
          }
          else {
            deferred.resolve(wm);
          }
        });
      }
      return deferred.promise;
    },

    createWebScene: function (item) {
      var deferred = new Deferred();
      if(!item) {
        deferred.reject(new Error("ItemHelper:: WebScene data does not exist."));
      }
      else if(item.data instanceof Error) {
        deferred.reject(item.data);
      }
      else {
        require(["esri/WebScene"], function (WebScene) {
          var ws;
          if(item.data) {
            ws = new WebScene({
              portalItem: item.data
            });
          }
          else if(item.json) {
            ws = WebScene.fromJSON(item.json.itemData);
            ws.portalItem = item.json.item;
          }
          if(!ws) {
            deferred.reject(new Error("ItemHelper:: WebScene does not have usable data."));
          }
          else {
            deferred.resolve(ws);
          }
        });
      }
      return deferred.promise;
    }

  });
});
