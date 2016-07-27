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
  "dojo/i18n!./nls/resources",
  "dojo/_base/array",
  "dojo/_base/declare"
], function (
  i18n,
  array,
  declare
) {

  return declare(null, {

    /**
     * Provides a hook for adjusting the config before the boilerplate builds the webmap/webscene/group gallery.
     * @param {Object} config Configuration assembled by boilerplate
     */
    /*adjustConfig: function (config) {
      config.title = "Custom title";

    },*/

    /**
     * Provides a hook for an alternate boilerplate error display.
     * @param {Object} node Dom node available for display
     * @param {Error} error Description of error
     */
    /*reportError: function (node, error) {
      node.innerHTML = "Custom error block<br>" + i18n.error + "<br>" + error.message;

    },*/

    /**
     * Runs the custom part of a map-based application following boilerplate completion.
     * @param {Object} config Configuration assembled by boilerplate
     * @param {WebMap|WebScene} map Map created by main
     * @param {MapView|SceneView} view View created by main after its creation deferred has been resolved
     */
    runMap: function (config, map, view) {

    },

    /**
     * Runs the custom part of a group-based application following boilerplate completion.
     * @param {Object} config Configuration assembled by boilerplate
     * @param {Object} view Dom div for main app display
     * @param {Object} info ArcGIS item info for group
     * @param {Array} items List of items in group
     */
    runGroup: function (config, viewDiv, info, items) {
      var html = "";

      html += "<h1>" + info.title + "</h1>";

      html += "<ol>";

      items.forEach(function (item) {
        html += "<li>" + item.title + "</li>";
      });

      html += "</ol>";

      viewDiv.innerHTML = html;
    }

  });
});
