import Portal = require("esri/portal/Portal");
import PortalItem = require("esri/portal/PortalItem");

interface ApplicationConfigs {
  application?: ApplicationConfig;
  config: ApplicationConfig;
  local?: ApplicationConfig;
  url?: ApplicationConfig;
}

export interface ApplicationConfig {
  appid?: string;
  center?: string;
  components?: string;
  embed?: boolean;
  extent?: string;
  find?: string;
  group?: string;
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
  webmap?: string;
  webscene?: string;
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

export interface BoilerplateApplicationResult {
  itemInfo: PortalItem;
  itemData: any;
}




// todo
export interface GroupData {
  itemsData?: any;
  infoData?: any;
}

// todo
export interface BoilerplateResults {
  group: GroupData;
  urlParams?: {
    [propName: string]: any;
  },
  localStorage?: {
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

// todo
export interface BoilerplateResponse {
  config: ApplicationConfig;
  settings: BoilerplateSettings;
  direction: string;
  results: BoilerplateResults;
  portal: Portal;
  locale: string;
  units: string;
}
