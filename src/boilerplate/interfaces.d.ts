import Portal = require("esri/portal/Portal");
import PortalItem = require("esri/portal/PortalItem");

export interface ApplicationConfigs {
  application?: ApplicationConfig;
  config: ApplicationConfig;
  local?: ApplicationConfig;
  url?: ApplicationConfig;
}

export interface ApplicationConfig {
  appid?: string;
  basemapUrl?: string;
  basemapReferenceUrl?: string;
  center?: string;
  components?: string;
  embed?: boolean;
  extent?: string;
  find?: string;
  group?: string | string[];
  helperServices?: {
    geometry?: {
      url: string;
    },
    printTask?: {
      url: string;
    },
    elevationSync?: {
      url: string;
    },
    geocode?: {
      url: string;
    }[],
    [propName: string]: any;
  },
  level?: string;
  marker?: string;
  oauthappid?: string;
  portalUrl?: string;
  proxyUrl?: string;
  title?: string;
  viewpoint?: string;
  webmap?: string | string[];
  webscene?: string | string[];
}

export interface BoilerplateSettings {
  environment: {
    isEsri?: boolean;
    webTierSecurity?: boolean;
  }
  localStorage?: {
    fetch?: boolean;
  },
  group?: {
    default?: string;
    itemParams?: {
      [propname: string]: any;
    },
    fetchItems?: boolean;
    fetchInfo?: boolean;
  },
  portal?: {
    fetch?: boolean;
  },
  urlParams?: string[];
  webmap?: {
    default?: string;
    containerId?: string;
    fetch?: boolean;
  },
  webscene?: {
    default?: string;
    containerId?: string;
    fetch?: boolean;
  }
}

export interface BoilerplateResult {
  error?: Error;
  value: any;
  promise: IPromise<any>;
}

export interface BoilerplateApplicationResult {
  itemInfo: PortalItem;
  itemData: any;
}

export interface BoilerplateResults {
  application?: BoilerplateResult;
  groupInfos?: BoilerplateResult[];
  groupItems?: BoilerplateResult[];
  localStorage?: {
    [propName: string]: any;
  },
  portal?: Portal;
  urlParams?: {
    [propName: string]: any;
  },
  webMapItems?: BoilerplateResult[];
  webSceneItems?: BoilerplateResult[];
}
