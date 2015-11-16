/*global define,document */
/*jslint sloppy:true,nomen:true */
/*
 | Copyright 2014 Esri
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
define(["dojo/_base/declare", "dojo/_base/lang",

"dojo/Deferred",

"dojo/dom", "dojo/dom-class",

"esri/Camera",

"esri/geometry/Point", "esri/geometry/SpatialReference",

"esri/views/SceneView", "esri/portal/PortalItem", "esri/WebScene",

"dojo/domReady!"], function (
declare, lang, Deferred, dom, domClass, Camera, Point, SpatialReference, SceneView, PortalItem, WebScene) {
    return declare(null, {
        config: {},
        startup: function (config) {
            var promise;
            // config will contain application and user defined info for the template such as i18n strings, the web map id
            // and application id
            // any url parameters and any application specific configuration information.
            if (config) {
                this.config = config;
                promise = this._createWebScene();
            } else {
                var error = new Error("Main:: Config is not defined");
                this.reportError(error);
                var def = new Deferred();
                def.reject(error);
                promise = def.promise;
            }
            return promise;
        },
        reportError: function (error) {
            // remove loading class from body
            domClass.remove(document.body, "app-loading");
            domClass.add(document.body, "app-error");
            // an error occurred - notify the user. In this example we pull the string from the
            // resource.js file located in the nls folder because we've set the application up
            // for localization. If you don't need to support multiple languages you can hardcode the
            // strings here and comment out the call in index.html to get the localization strings.
            // set message
            var node = dom.byId("loading_message");
            if (node) {
                if (this.config && this.config.i18n) {
                    node.innerHTML = this.config.i18n.scene.error + ": " + error.message;
                } else {
                    node.innerHTML = "Unable to create scene: " + error.message;
                }
            }
            return error;
        },

        // create a scene based on the input web scene id
        _createWebScene: function () {
            // Create a scene from json will be coming.
            // for now scene from id only. 
            // if(this.config.itemInfo){
            //   scene = new WebScene(this.config.itemInfo);
            // }else{  
            if (!this.config.webscene) {
                return;
            }

            var scene = new WebScene({
                portalItem: new PortalItem({
                    id: this.config.webscene
                })
            });
            var viewProperties = {
                map: scene,
                container: "viewDiv"
            };
            if (this.config.components) {
                viewProperties.ui = {
                    components: this.config.components.split(",")
                };
            }
            var camera = this._setCameraViewpoint();
            if (camera) {
                viewProperties.camera = camera;
            }

            var view = new SceneView(viewProperties);

            view.then(lang.hitch(this, function (response) {

                domClass.remove(document.body, "app-loading");
                document.title = scene.portalItem.title;

                return response;
            }), this.reportError);

        },
        _setCameraViewpoint() {
            var viewpointParamString;
            if (this.config.viewpoint) {
                viewpointParamString = this.config.viewpoint;
            } else {
                return null;
            }

            var viewpointArray = viewpointParamString.split(";");

            if (viewpointArray.length > 0) {
                var cameraString = "";
                var tiltHeading = "";
                for (var i = 0; i < viewpointArray.length; i++) {
                    if (viewpointArray[i].indexOf("cam:") !== -1) {
                        cameraString = viewpointArray[i];
                    } else {
                        tiltHeading = viewpointArray[i];
                    }
                }
                if (cameraString !== "") {
                    cameraString = cameraString.substr(4, cameraString.length - 4);
                    var positionArray = cameraString.split(",");
                    if (positionArray.length >= 3) {
                        var x = 0,
                            y = 0,
                            z = 0;
                        x = parseFloat(positionArray[0]);
                        y = parseFloat(positionArray[1]);
                        z = parseFloat(positionArray[2]);
                        var sr = SpatialReference.WGS84;


                        if (positionArray.length === 4) {
                            sr = new SpatialReference(parseInt(positionArray[3], 10));
                        }

                        var cameraPosition = new Point(x, y, z, sr);
                        var heading = 0,
                            tilt = 0;
                        if (tiltHeading !== "") {
                            var tiltHeadingArray = tiltHeading.split(",");
                            if (tiltHeadingArray.length >= 0) {
                                heading = parseFloat(tiltHeadingArray[0]);
                                if (tiltHeadingArray.length > 1) {
                                    tilt = parseFloat(tiltHeadingArray[1]);
                                }
                            }
                        }
                        var camera = new Camera({
                            position: cameraPosition,
                            heading: heading,
                            tilt: tilt
                        });
                        return camera;

                    }
                }
            } else {
                return null;
            }
        }
    });
});