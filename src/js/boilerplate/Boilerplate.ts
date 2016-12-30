import * as applicationConfig from "dojo/text!config/config.json";
import dojoDeclare = require("dojo/_base/declare");
import kernel = require("dojo/_base/kernel");
import lang = require("dojo/_base/lang");

import Deferred = require("dojo/Deferred");
import esriConfig = require("esri/config");

import IdentityManager = require("esri/identity/IdentityManager");
import OAuthInfo = require("esri/identity/OAuthInfo");

import Portal = require("esri/portal/Portal");
import PortalItem = require("esri/portal/PortalItem");
import PortalQueryParam = require("esri/portal/PortalQueryParams");

// Fails = need to talk to Jesse to find out why its not in the
// arcgis-js-api.d.ts file import promiseUtils =
// require("esri/core/promiseUtils");
