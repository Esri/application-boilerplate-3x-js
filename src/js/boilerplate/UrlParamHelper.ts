import declare = require("dojo/_base/declare");

import Camera = require("esri/Camera");

import Extent = require("esri/geometry/Extent");
import Point = require("esri/geometry/Point");

import MapView = require("esri/views/MapView");
import SceneView = require("esri/views/SceneView");

import MapViewProperties = __esri.MapViewProperties;
import SceneViewProperties = __esri.SceneViewProperties;

import DefaultUIProperties = __esri.DefaultUIProperties;

const DEFAULT_MARKER_SYMBOL = {
  // url: require.toUrl("./symbols/mapPin.png"),
  width: "36px",
  height: "19px",
  xoffset: "9px",
  yoffset: "18px"
};

interface AppViewProperties {
  components: DefaultUIProperties;
  viewProperties: MapViewProperties | SceneViewProperties;
}
class UrlParamHelper {
  // --------------------------------------------------------------------------
  //
  //  Public Methods
  //
  // --------------------------------------------------------------------------

  public getViewProperties(config: any) {
    let props: AppViewProperties;
    if (config.components) {
      props.components = config.components.split(",");
    }
    return props;
  }
  private viewPointStringToCamera(viewPointParamString: string) {
    const viewPointArray: string[] = viewPointParamString && viewPointParamString.split(";");
    if (!viewPointArray || !viewPointArray.length) {
      return;
    }
  }
};
export = UrlParamHelper;
