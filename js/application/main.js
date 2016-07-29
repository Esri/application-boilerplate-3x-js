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
  "dojo/_base/declare"
], function (
  i18n,
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
     * Runs the custom part of an application following boilerplate completion.
     * @param {Object} options Structure containing 'config' (configuration assembled by boilerplate), and optional properties 'view' (resolved MapView or SceneView created in init),
     * 'webScene' (resolved WebScene created in init), 'webMap' (resolved WebMap created in init), 'groupInfo' (ArcGIS
     * item groupInfo for group), 'groupItems' (list of groupItems in group), 'settings' (boilerplate underlying settings from settings.json)
     */
    start: function (options) {



      if (options.groupInfo && options.groupItems) {
        var html = "";

        html += "<h1>" + options.groupInfo.title + "</h1>";

        html += "<ol>";

        options.groupItems.forEach(function (item) {
          html += "<li>" + item.title + "</li>";
        });

        html += "</ol>";

        document.body.innerHTML = html;
      }


    }

  });
});
