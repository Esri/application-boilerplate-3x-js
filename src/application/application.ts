/// <amd-dependency path="dojo/i18n!application/nls/resources.js" name="i18n" />
declare const i18n: any;

import requireUtils = require("esri/core/requireUtils");
import promiseUtils = require("esri/core/promiseUtils");

import Boilerplate from 'boilerplate/Boilerplate';

import WebMap = require("esri/WebMap");
import WebScene = require("esri/WebScene");

import MapView = require("esri/views/MapView");
import SceneView = require("esri/views/SceneView");

import PortalItem = require("esri/portal/PortalItem");

import {
  createMap,
  createView,
  getViewProperties,
  getItemTitle,
  setBasemap,
  setFindLocation,
  setGraphic
} from "boilerplate/support/itemUtils";

import {
  addPageError,
  removePageLoading,
  setPageLocale,
  setPageDirection,
  setPageTitle
} from "boilerplate/support/domHelper";

import {
  ApplicationConfig,
  BoilerplateSettings
} from "boilerplate/interfaces";

class Application {

  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------

  //----------------------------------
  //  boilerplate
  //----------------------------------
  boilerplate: Boilerplate = null;

  //--------------------------------------------------------------------------
  //
  //  Public Methods
  //
  //--------------------------------------------------------------------------

  public init(boilerplate: Boilerplate): void {
    if (!boilerplate) {
      addPageError({
        title: i18n.error,
        message: "Boilerplate is not defined"
      });
      return;
    }

    setPageLocale(boilerplate.locale);
    setPageDirection(boilerplate.direction);

    this.boilerplate = boilerplate;

    const { config, results, settings } = boilerplate;
    const { find, marker } = config;
    const { webMapItems, webSceneItems } = results;

    const validWebMapItems = webMapItems.map(response => {
      return response.value;
    });

    const validWebSceneItems = webSceneItems.map(response => {
      return response.value;
    });

    const firstItem = validWebMapItems[0] || validWebSceneItems[0];

    if (!firstItem) {
      addPageError({
        title: i18n.error,
        message: "Could not load an item to display"
      });
      return;
    }

    config.title = !config.title ? getItemTitle(firstItem) : "";
    setPageTitle(config.title);

    const viewContainerNode = document.getElementById("viewContainer");

    const viewNodes = [];

    const defaultViewProperties = getViewProperties(config);

    validWebMapItems.forEach(webMapItem => {
      const viewNode = document.createElement("div");

      viewNodes.push(viewNode);

      const viewProperties = {
        container: viewNode,
        ...defaultViewProperties
      };

      createMap(webMapItem)
        .then(map => setBasemap(map, config)
          .then(map => createView(map, viewProperties)
            .then(view => setFindLocation(find, view)
              .then(() => setGraphic(marker, view)))));
    });

    validWebSceneItems.forEach(webSceneItem => {
      const viewNode = document.createElement("div");

      viewNodes.push(viewNode);

      const viewProperties = {
        container: viewNode,
        ...defaultViewProperties
      };

      createMap(webSceneItem)
        .then(map => setBasemap(map, config)
          .then(map => createView(map, viewProperties)
            .then(view => setFindLocation(find, view)
              .then(() => setGraphic(marker, view)))));
    });

    viewNodes.forEach(viewNode => {
      viewContainerNode.appendChild(viewNode);
    });

    removePageLoading();
  }

  //--------------------------------------------------------------------------
  //
  //  Private Methods
  //
  //--------------------------------------------------------------------------


}

export default Application;
