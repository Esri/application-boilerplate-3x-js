import Portal = require("esri/portal/Portal");
import PortalItem = require("esri/portal/PortalItem");

// todo: organize all interfaces. alpahbetically

export interface ApplicationConfig {
  title?: string;
  webmap?: string;
  webscene?: string;
  application_extent?: string;
  portalUrl?: string;
  proxyUrl?: string;
  group?: string;
  appid?: string;
  components?: string;
  viewpoint?: string;
  center?: string;
  level?: string;
  extent?: string;
  oauthappid?: string;
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
  }
}

export interface BoilerplateSettings {
  webscene?: {
    containerId?: string;
    fetch?: boolean;
  },
  webmap?: {
    containerId?: string;
    fetch?: boolean;
  },
  group?: {
    itemParams?: {
      [propname: string]: any;
    },
    fetchItems?: boolean;
    fetchInfo?: boolean;
  },
  portal?: {
    fetch?: boolean;
  },
  urlItems?: string[];
  localConfig?: {
    fetch?: boolean;
  },
  webTierSecurity?: boolean;
  esriEnvironment?: boolean;
  defaultWebmap?: string;
  defaultWebscene?: string;
  defaultGroup?: string;
}

export interface GroupData {
  itemsData?: any;
  infoData?: any;
}

export interface BoilerplateResults {
  group: GroupData;
  urlParams?: {
    [propName: string]: any;
  },
  localStorageConfig?: {
    [propName: string]: any;
  },
  webMapItem?: PortalItem | Error;
  webSceneItem?: PortalItem | Error;
  applicationItem?: {
    item: PortalItem | Error,
    data: any;
  };
  portal?: Portal;
}

export interface BoilerplateResponse {
  config: ApplicationConfig;
  settings: BoilerplateSettings;
  direction: string;
  results: BoilerplateResults;
  portal: Portal;
  locale: string;
  units: string;
}
