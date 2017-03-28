import Camera = require('esri/Camera');
import Extent = require('esri/geometry/Extent');
import Point = require('esri/geometry/Point');
import Search = require('esri/widgets/Search');
import Basemap = require('esri/Basemap');
import Layer = require('esri/layers/Layer');
import promiseList = require('esri/core/promiseUtils');
import Graphic = require('esri/Graphic');
import PopupTemplate = require('esri/PopupTemplate');
import PictureMarkerSymbol = require('esri/symbols/PictureMarkerSymbol');
import MapView = require("esri/views/MapView");
import SceneView = require("esri/views/SceneView");
import { Config } from 'boilerplate/interfaces';

interface ViewProperties {
  ui?: {
    components?: string[]
  },
  camera?: Camera,
  center?: Point,
  zoom?: number,
  extent?: Extent
}

interface CameraProperties {
  position?: Point;
  tilt?: number;
  heading?: number;
}

//--------------------------------------------------------------------------
//
//  Static constiables
//
//--------------------------------------------------------------------------

const DEFAULT_MARKER_SYMBOL = {
  url: "./symbols/mapPin.png",
  width: "36px" as any as number, // todo: fix typings in next JS API release.
  height: "19px" as any as number, // todo: fix typings in next JS API release.
  xoffset: "9px" as any as number, // todo: fix typings in next JS API release.
  yoffset: "18px" as any as number // todo: fix typings in next JS API release.
};

class UrlParamHelper {

  public getViewProperties(config: Config): ViewProperties {
    const viewProperties: ViewProperties = {};

    if (config.components) {
      const components = config.components.split(",");
      viewProperties.ui = {
        components: components
      };
    }

    const camera = this.viewpointStringToCamera(config.viewpoint);
    if (camera) {
      viewProperties.camera = camera;
    }

    const center = this.centerStringToPoint(config.center);
    if (center) {
      viewProperties.center = center;
    }

    const level = this.levelStringToLevel(config.level);
    if (level) {
      viewProperties.zoom = level;
    }

    const extent = this.extentStringToExtent(config.extent);
    if (extent) {
      viewProperties.extent = extent;
    }

    return viewProperties;
  }

  public addToView(view: MapView | SceneView, config, searchWidget?: Search): void {
    this.addMarkerToView(view, config.marker);
    this.find(view, config.find, searchWidget);
    this.setBasemapOnView(view, config.basemapUrl, config.basemapReferenceUrl);
  }

  public find(view: MapView | SceneView, findString, searchWidget?: Search): Search {
    if (!findString) {
      return;
    }

    if (searchWidget) {
      searchWidget.search(findString);
    }
    else {
      searchWidget = new Search({
        view: view
      });
      searchWidget.search(findString);
    }

    return searchWidget;
  }

  public setBasemapOnView(view: MapView | SceneView, basemapUrl, basemapReferenceUrl): void {
    if (!basemapUrl || !view) {
      return;
    }

    const getBaseLayers = promiseList.eachAlways({
      baseLayer: Layer.fromArcGISServerUrl({
        url: basemapUrl
      }),
      referenceLayer: Layer.fromArcGISServerUrl({
        url: basemapReferenceUrl
      })
    });
    getBaseLayers.then((response) => {
      const baseLayer = response.baseLayer;
      const referenceLayer = response.referenceLayer;
      if (!baseLayer) {
        return;
      }
      const basemapOptions = {
        baseLayers: baseLayer,
        referenceLayers: referenceLayer
      };
      view.map.basemap = new Basemap(basemapOptions);
    });
  }

  public viewpointStringToCamera(viewpointString: string): Camera {
    // &viewpoint=cam:-122.69174973,45.53565982,358.434;117.195,59.777
    const viewpointArray = viewpointString && viewpointString.split(";");

    if (!viewpointArray || !viewpointArray.length) {
      return;
    }

    const cameraIndex = viewpointArray[0].indexOf("cam:") !== -1 ? 0 : 1;
    const tiltAndHeadingIndex = cameraIndex === 0 ? 1 : 0;
    const cameraString = viewpointArray[cameraIndex];
    const tiltAndHeadingString = viewpointArray[tiltAndHeadingIndex];
    const cameraProperties = this._getCameraProperties(cameraString, tiltAndHeadingString);

    if (cameraProperties.position) {
      return new Camera(cameraProperties);
    }
  }

  public extentStringToExtent(extentString: string): Extent {
    if (!extentString) {
      return null;
    }

    //?extent=-13054125.21,4029134.71,-13032684.63,4041785.04,102100 or ?extent=-13054125.21;4029134.71;-13032684.63;4041785.04;102100
    //?extent=-117.2672,33.9927,-117.0746,34.1064 or ?extent=-117.2672;33.9927;-117.0746;34.1064
    const extentArray = this._splitURLString(extentString);
    const extentLength = extentArray.length;

    if (extentLength < 4) {
      return null;
    }

    const xmin = parseFloat(extentArray[0]),
      ymin = parseFloat(extentArray[1]),
      xmax = parseFloat(extentArray[2]),
      ymax = parseFloat(extentArray[3]);

    if (isNaN(xmin) || isNaN(ymin) || isNaN(xmax) || isNaN(ymax)) {
      return null;
    }

    const wkid = extentLength === 5 ? parseInt(extentArray[4], 10) : 4326;
    const ext = new Extent({
      xmin: xmin,
      ymin: ymin,
      xmax: xmax,
      ymax: ymax,
      spatialReference: {
        wkid: wkid
      }
    });
    return ext;
  }

  public centerStringToPoint(centerString: string): Point {
    //?center=-13044705.25,4036227.41,102113&level=12 or ?center=-13044705.25;4036227.41;102113&level=12
    //?center=-117.1825,34.0552&level=12 or ?center=-117.1825;34.0552&level=12
    if (!centerString) {
      return null;
    }

    const centerArray = this._splitURLString(centerString);
    const centerLength = centerArray.length;

    if (centerLength < 2) {
      return null;
    }

    const x = parseFloat(centerArray[0]);
    const y = parseFloat(centerArray[1]);

    if (isNaN(x) || isNaN(y)) {
      return null;
    }

    const wkid = centerLength === 3 ? parseInt(centerArray[2], 10) : 4326;
    return new Point({
      x: x,
      y: y,
      spatialReference: {
        wkid: wkid
      }
    });
  }

  public levelStringToLevel(levelString: string): number {
    return levelString && parseInt(levelString, 10);
  }

  public addMarkerToView(view: MapView | SceneView, markerString: string): void {
    // ?marker=-117;34;4326;My%20Title;http%3A//www.daisysacres.com/images/daisy_icon.gif;My%20location&level=10
    // ?marker=-117,34,4326,My%20Title,http%3A//www.daisysacres.com/images/daisy_icon.gif,My%20location&level=10
    // ?marker=-13044705.25,4036227.41,102100,My%20Title,http%3A//www.daisysacres.com/images/daisy_icon.gif,My%20location&level=10
    // ?marker=-117,34,,My%20Title,http%3A//www.daisysacres.com/images/daisy_icon.gif,My%20location&level=10
    // ?marker=-117,34,,,,My%20location&level=10
    // ?marker=-117,34&level=10
    // ?marker=10406557.402,6590748.134,2526

    if (!markerString) {
      return null;
    }

    const markerArray = this._splitURLString(markerString);
    const markerLength = markerArray.length;

    if (markerLength < 2) {
      return null;
    }

    const x = parseFloat(markerArray[0]);
    const y = parseFloat(markerArray[1]);
    const content = markerArray[3];
    const icon_url = markerArray[4];
    const label = markerArray[5];
    const wkid = markerArray[2] ? parseInt(markerArray[2], 10) : 4326;
    const symbolSize = "32px" as any as number; // todo: fix typings in next JS API release.
    const symbolOptions = icon_url ? {
      url: icon_url,
      height: symbolSize,
      width: symbolSize
    } : DEFAULT_MARKER_SYMBOL;
    const markerSymbol = new PictureMarkerSymbol(symbolOptions);
    const point = new Point({
      "x": x,
      "y": y,
      "spatialReference": {
        "wkid": wkid
      }
    });
    const hasPopupDetails = content || label;
    const popupTemplate = hasPopupDetails ?
      new PopupTemplate({
        "title": label || null,
        "content": content || null
      }) : null;

    const graphic = new Graphic({
      geometry: point,
      symbol: markerSymbol,
      popupTemplate: popupTemplate
    });

    if (!graphic) {
      return null;
    }
    view.graphics.add(graphic);
    // todo: will be cleaned up in next JS API release.
    if (view instanceof SceneView) {
      view.goTo(graphic);
    }
    else {
      view.goTo(graphic);
    }
  }

  private _splitURLString(value: string): string[] {
    if (!value) {
      return null;
    }

    const splitValues = value.split(";");

    return splitValues.length === 1 ? value.split(",") : null;
  }

  private _getCameraPosition(cameraString: string): Point {
    if (!cameraString) {
      return null;
    }

    const cameraValues = cameraString.substr(4, cameraString.length - 4);
    const positionArray = cameraValues.split(",");

    if (positionArray.length < 3) {
      return null;
    }

    const x = parseFloat(positionArray[0]),
      y = parseFloat(positionArray[1]),
      z = parseFloat(positionArray[2]);
    const wkid = positionArray.length === 4 ? parseInt(positionArray[3], 10) : 4326;
    return new Point({
      x: x,
      y: y,
      z: z,
      spatialReference: {
        wkid: wkid
      }
    });
  }

  private _getTiltAndHeading(tiltAndHeading: string): CameraProperties {
    if (tiltAndHeading == "") {
      return null;
    }

    const tiltHeadingArray = tiltAndHeading.split(",");

    return tiltHeadingArray.length >= 0 ? {
      heading: parseFloat(tiltHeadingArray[0]),
      tilt: parseFloat(tiltHeadingArray[1])
    } : null;
  }

  private _getCameraProperties(cameraString: string, tiltAndHeading: string): CameraProperties {
    const cameraPosition = this._getCameraPosition(cameraString);
    const tiltAndHeadingProperties = this._getTiltAndHeading(tiltAndHeading);

    return {
      position: cameraPosition,
      ...tiltAndHeadingProperties
    };
  }

}

export default UrlParamHelper;