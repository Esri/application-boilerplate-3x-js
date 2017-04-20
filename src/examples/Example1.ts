/// <amd-dependency path="dojo/i18n!application/nls/resources.js" name="i18n" />
declare const i18n: any;

import Boilerplate from 'boilerplate/Boilerplate';

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

class Example1 {

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

    const validItems = validWebMapItems.concat(validWebSceneItems);

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
    const defaultViewProperties = getViewProperties(config);

    validItems.forEach(item => {
      const viewNode = document.createElement("div");
      viewContainerNode.appendChild(viewNode);

      const viewProperties = {
        container: viewNode,
        ...defaultViewProperties
      };

      createMap(item)
        .then(map => setBasemap(map, config)
          .then(map => createView(map, viewProperties)
            .then(view => setFindLocation(find, view)
              .then(() => setGraphic(marker, view)))));
    });

    removePageLoading();
  }

}

export default Example1;
