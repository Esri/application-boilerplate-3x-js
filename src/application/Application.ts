/// <amd-dependency path="dojo/i18n!application/nls/resources.js" name="i18n" />
declare const i18n: any;

import Boilerplate from 'boilerplate/Boilerplate';

import {
  removePageLoading
} from "./ApplicationState";

class Application {

  //--------------------------------------------------------------------------
  //
  //  Lifecycle
  //
  //--------------------------------------------------------------------------

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
    console.log(boilerplate);
    removePageLoading();
  }

  //--------------------------------------------------------------------------
  //
  //  Private Methods
  //
  //--------------------------------------------------------------------------

}

export default Application;
