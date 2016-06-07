var package_path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/"));
var dojoConfig = {
  async: true,
  packages: [{
    name: "application",
    location: package_path + "/js"
  }, {
    name: "config",
    location: package_path + "/config"
  }, {
    name: "arcgis_templates",
    location: package_path + "/.."
  }]
};
