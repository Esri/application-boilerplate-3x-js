/// <amd-dependency path="dojo/i18n!application/nls/resources.js" name="i18n" />
declare const i18n: any;

import Boilerplate from 'boilerplate/Boilerplate';

import {
  removePageLoading
} from "boilerplate/support/domHelper";

class GroupExample {

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

    removePageLoading();

    const { results } = boilerplate;
    const groupInfos = results.groupInfos[0];
    const groupItems = results.groupItems[0];
    const groupInfoResults = groupInfos.value && groupInfos.value.results;
    const groupItemsResults = groupItems.value && groupItems.value.results;
    const groupInfo = groupItemsResults && groupInfoResults[0];

    if (!groupInfos || !groupItems || !groupInfoResults || !groupItemsResults || !groupInfo) {
      return;
    }

    var html = "";
    html += "<h1>" + groupInfo.title + "</h1>";
    html += "<ol>";
    groupItemsResults.forEach(function (item) {
      html += "<li>" + item.title + "</li>";
    });
    html += "</ol>";
    var groupNode = document.getElementById("groupContainer");
    groupNode.innerHTML = html;
  }

}

export default GroupExample;
