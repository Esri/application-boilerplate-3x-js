/* global dojoConfig:true */
var package_path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/"));
dojoConfig = {
  async: true,
  parseOnLoad: true,
  packages: [
    { name: "arcgis-devtools", location: "https://rawgit.com/ycabon/arcgis-js-api-devtools/master/dist" },
    { name: "put-selector", location: "//maps.esri.com/AGSJS_Demos/support/put-selector" },
    { name: "widgets", location: "//maps.esri.com/AGSJS_Demos/support/widgets" },
    { name: "application", location: package_path + "/js/application", main: "main" },
    { name: "boilerplate", location: package_path + "/js/boilerplate", main: "Boilerplate" },
    { name: "config", location: package_path + "/config" }
  ]
};
if(location.search.match(/locale=([\w-]+)/)) {
  dojoConfig.locale = RegExp.$1;
}
