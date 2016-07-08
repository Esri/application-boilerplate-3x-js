define([

  "dojo/i18n!./nls/resources",

  "dojo/_base/declare",
  "dojo/_base/kernel",

  "dojo/dom",
  "dojo/dom-attr",
  "dojo/dom-class",

  "esri/Camera",

  "esri/geometry/Point",
  "esri/geometry/SpatialReference",

  "esri/portal/PortalItem",

  "esri/views/SceneView",

  "esri/WebScene",

  "dojo/domReady!"

], function (
  i18n,
  declare, kernel,
  dom, domAttr, domClass,
  Camera,
  Point, SpatialReference,
  PortalItem,
  SceneView,
  WebScene
) {

  //--------------------------------------------------------------------------
  //
  //  Static Variables
  //
  //--------------------------------------------------------------------------

  var CSS = {
    loading: "app-bp--loading",
    error: "app-bp--error"
  };

  var RTL_LANGS = ["ar", "he"];
  var LTR = "ltr";
  var RTL = "rtl";

  return declare(null, {

    //--------------------------------------------------------------------------
    //
    //  Variables
    //
    //--------------------------------------------------------------------------

    config: {},

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------


    startup: function (boilerplate) {

      console.log(boilerplate);

      var config = boilerplate.config;
      if (config) {
        this.config = config;
        this._setDirection();
        this._createWebScene();
      }
      else {
        var error = new Error("Main:: Config is not defined");
        this.reportError(error);
      }
    },

    reportError: function (error) {
      // remove loading class from body
      domClass.remove(document.body, CSS.loading);
      domClass.add(document.body, CSS.error);
      // an error occurred - notify the user. In this example we pull the string from the
      // resource.js file located in the nls folder because we've set the application up
      // for localization. If you don't need to support multiple languages you can hardcode the
      // strings here and comment out the call in index.html to get the localization strings.
      // set message
      var node = dom.byId("loading_message");
      if (node) {
        node.innerHTML = i18n.scene.error + ": " + error.message;
      }
      return error;
    },

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _setDirection: function () {
      var direction = LTR;
      RTL_LANGS.some(function (l) {
        if (kernel.locale.indexOf(l) !== -1) {
          direction = RTL;
          return true;
        }
        return false;
      });
      var dirNode = document.getElementsByTagName("html")[0];
      domAttr.set(dirNode, "dir", direction);
    },

    // create a scene based on the input web scene id
    _createWebScene: function () {
      // Create a scene from json will be coming.
      // for now scene from id only.
      var scene;
      if (this.config.itemInfo) {
        scene = WebScene.fromJSON(this.config.itemInfo);
      }
      else {
        scene = new WebScene({
          // todo: this should be done in the boilerplate
          portalItem: new PortalItem({
            id: this.config.webscene
          })
        });
      }
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
      view.then(function (response) {
        domClass.remove(document.body, CSS.loading);
        document.title = scene.portalItem.title;
      }.bind(this), this.reportError);
    },

    _setCameraViewpoint: function () {
      var viewpointParamString = this.config.viewpoint;
      var viewpointArray = viewpointParamString && viewpointParamString.split(";");
      if (!viewpointArray || !viewpointArray.length) {
        return;
      }
      else {
        var cameraString = "";
        var tiltHeading = "";
        for (var i = 0; i < viewpointArray.length; i++) {
          if (viewpointArray[i].indexOf("cam:") !== -1) {
            cameraString = viewpointArray[i];
          }
          else {
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
      }
    }
  });
});
