import Basemap = require("esri/Basemap");
import Camera = require("esri/Camera");
import Graphic = require("esri/Graphic");

import promiseUtils = require("esri/core/promiseUtils");
import requireUtils = require("esri/core/requireUtils");
import watchUtils = require("esri/core/watchUtils");

import Extent = require("esri/geometry/Extent");
import Point = require("esri/geometry/Point");

import MapView = require("esri/views/MapView");
import SceneView = require("esri/views/SceneView");

import {
  ApplicationConfig
} from "boilerplate/interfaces";

interface ViewProperties {
  extent?: Extent;
  camera?: Camera;
  center?: Point;
  ui?: {
    components?: string[];
  },
  zoom?: number;
}

interface CameraProperties {
  heading?: number;
  position?: Point;
  tilt?: number;
}

//--------------------------------------------------------------------------
//
//  Public Methods
//
//--------------------------------------------------------------------------

export function getViewProperties(config: ApplicationConfig): any {
  const { camera, center, components, extent, level } = config;
  const ui = components ? { ui: { components: getComponents(components) } } : null;
  const cameraProps = camera ? { camera: getCamera(camera) } : null;
  const centerProps = center ? { center: getPoint(center) } : null;
  const zoomProps = level ? { zoom: getZoom(level) } : null;
  const extentProps = extent ? { extent: getExtent(extent) } : null;

  const urlViewProperties = {
    ...ui,
    ...cameraProps,
    ...centerProps,
    ...zoomProps,
    ...extentProps
  };

  return {
    ...urlViewProperties
  };
}

export function getComponents(components: string): string[] {
  if (!components) {
    return;
  }
  return components.split(",");
}

export function getCamera(viewpointString: string): Camera {
  // ?viewpoint=cam:-122.69174973,45.53565982,358.434;117.195,59.777
  const viewpointArray = viewpointString && viewpointString.split(";");

  if (!viewpointArray || !viewpointArray.length) {
    return;
  }

  const cameraIndex = viewpointArray[0].indexOf("cam:") !== -1 ? 0 : 1;
  const tiltAndHeadingIndex = cameraIndex === 0 ? 1 : 0;
  const cameraString = viewpointArray[cameraIndex];
  const tiltAndHeadingString = viewpointArray[tiltAndHeadingIndex];
  const cameraProperties = _getCameraProperties(cameraString, tiltAndHeadingString);

  if (cameraProperties.position) {
    return new Camera(cameraProperties);
  }

  return;
}

export function getPoint(center: string): Point {
  // ?center=-13044705.25,4036227.41,102113&level=12
  // ?center=-13044705.25;4036227.41;102113&level=12
  // ?center=-117.1825,34.0552&level=12
  // ?center=-117.1825;34.0552&level=12
  if (!center) {
    return null;
  }

  const centerArray = _splitURLString(center);
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

export function getZoom(level: string): number {
  return level && parseInt(level, 10);
}

export function getExtent(extent: string): Extent {
  // ?extent=-13054125.21,4029134.71,-13032684.63,4041785.04,102100
  // ?extent=-13054125.21;4029134.71;-13032684.63;4041785.04;102100
  // ?extent=-117.2672,33.9927,-117.0746,34.1064
  // ?extent=-117.2672;33.9927;-117.0746;34.1064
  if (!extent) {
    return null;
  }

  const extentArray = _splitURLString(extent);
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

export function getGraphic(marker: string): IPromise<Graphic> {
  // ?marker=-117;34;4326;My Title;http://www.daisysacres.com/images/daisy_icon.gif;My location&level=10
  // ?marker=-117,34,4326,My Title,http://www.daisysacres.com/images/daisy_icon.gif,My location&level=10
  // ?marker=-13044705.25,4036227.41,102100,My Title,http://www.daisysacres.com/images/daisy_icon.gif,My location&level=10
  // ?marker=-117,34,,My Title,http://www.daisysacres.com/images/daisy_icon.gif,My location&level=10
  // ?marker=-117,34,,,,My location&level=10
  // ?marker=-117,34&level=10
  // ?marker=10406557.402,6590748.134,2526

  if (!marker) {
    return promiseUtils.reject();
  }

  const markerArray = _splitURLString(marker);
  const markerLength = markerArray.length;

  if (markerLength < 2) {
    return promiseUtils.reject();
  }

  return requireUtils.when(require, [
    "esri/Graphic",
    "esri/PopupTemplate",
    "esri/symbols/PictureMarkerSymbol"
  ]).then(modules => {
    const [Graphic, PopupTemplate, PictureMarkerSymbol] = modules;

    const x = parseFloat(markerArray[0]);
    const y = parseFloat(markerArray[1]);
    const content = markerArray[3];
    const icon_url = markerArray[4];
    const label = markerArray[5];
    const wkid = markerArray[2] ? parseInt(markerArray[2], 10) : 4326;
    const symbolSize = "32px" as any as number; // todo: fix typings in next JS API release.

    const defaultMarkerSymbol = {
      url: require.toUrl("./symbols/marker.png"),
      width: "32px" as any as number, // todo: fix typings in next JS API release.
      height: "32px" as any as number, // todo: fix typings in next JS API release.
    };

    const symbolOptions = icon_url ? {
      url: icon_url,
      height: symbolSize,
      width: symbolSize
    } : defaultMarkerSymbol;
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
        "title": content || null,
        "content": label || null
      }) : null;

    const graphic = new Graphic({
      geometry: point,
      symbol: markerSymbol,
      popupTemplate: popupTemplate
    });
    return graphic;
  });
}

export function getBasemap(basemapUrl: string, basemapReferenceUrl: string): IPromise<Basemap> {
  // ?basemapUrl=https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer&basemapReferenceUrl=http://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer
  if (!basemapUrl) {
    return promiseUtils.reject();
  }

  return requireUtils.when(require, ["esri/layers/Layer", "esri/Basemap"]).then(modules => {
    const [Layer, Basemap] = modules;

    const getBaseLayer = Layer.fromArcGISServerUrl({
      url: basemapUrl
    });

    const getReferenceLayer = basemapReferenceUrl ? Layer.fromArcGISServerUrl({
      url: basemapReferenceUrl
    }) : promiseUtils.resolve();

    const getBaseLayers = promiseUtils.eachAlways({
      baseLayer: getBaseLayer,
      referenceLayer: getReferenceLayer
    });

    return getBaseLayers.then(response => {
      const baseLayer = response.baseLayer;
      const referenceLayer = response.referenceLayer;
      const basemapOptions = {
        baseLayers: [baseLayer.value],
        referenceLayers: referenceLayer.value ? [referenceLayer.value] : []
      };
      return new Basemap(basemapOptions).load();;
    });
  });
}

export function find(query: string, view: MapView | SceneView): IPromise<{}> {
  // ?find=redlands, ca
  if (!query || !view) {
    return promiseUtils.reject();
  }

  return requireUtils.when(require, "esri/widgets/Search/SearchViewModel").then(SearchViewModel => {
    const searchVM = new SearchViewModel({
      view: view
    });
    return searchVM.search(query).then(() => {
      watchUtils.whenFalseOnce(view, "popup.visible", () => searchVM.destroy());
    });
  });
}

//--------------------------------------------------------------------------
//
//  Private Methods
//
//--------------------------------------------------------------------------

function _splitURLString(value: string): string[] {
  if (!value) {
    return null;
  }

  const splitValues = value.split(";");

  return splitValues.length === 1 ? value.split(",") : splitValues;
}

function _getCameraPosition(cameraString: string): Point {
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

function _getTiltAndHeading(tiltAndHeading: string): CameraProperties {
  if (tiltAndHeading == "") {
    return null;
  }

  const tiltHeadingArray = tiltAndHeading.split(",");

  return tiltHeadingArray.length >= 0 ? {
    heading: parseFloat(tiltHeadingArray[0]),
    tilt: parseFloat(tiltHeadingArray[1])
  } : null;
}

function _getCameraProperties(cameraString: string, tiltAndHeading: string): CameraProperties {
  const cameraPosition = _getCameraPosition(cameraString);
  const tiltAndHeadingProperties = _getTiltAndHeading(tiltAndHeading);

  return {
    position: cameraPosition,
    ...tiltAndHeadingProperties
  };
}
